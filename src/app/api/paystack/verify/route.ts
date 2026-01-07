/**
 * Paystack Payment Verification API Route
 * Production-ready implementation with:
 * - Atomic transactions
 * - Rate limiting
 * - Proper error handling
 * - Idempotency
 * - Retry logic
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { getRequiredEnv } from '@/lib/utils/env';
import { createErrorResponse, createSuccessResponse, ErrorCodes } from '@/lib/api/errors';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { retryDatabaseOperation } from '@/lib/utils/retry';
import { validatePaymentAmount, validateCurrency, validateUUID } from '@/lib/utils/validation';

const PAYSTACK_VERIFY_URL = 'https://api.paystack.co/transaction/verify';

/**
 * Payment verification endpoint with production-ready features
 */
export async function POST(request: NextRequest) {
    try {
        // Parse request body
        let body;
        try {
            body = await request.json();
        } catch (error) {
            return createErrorResponse(
                'Invalid request body',
                400,
                ErrorCodes.INVALID_INPUT
            );
        }

        const { reference, course_id } = body;

        // Validate required fields
        if (!reference || typeof reference !== 'string' || reference.trim().length === 0) {
            return createErrorResponse(
                'Missing or invalid payment reference',
                400,
                ErrorCodes.MISSING_FIELDS
            );
        }

        if (!course_id || !validateUUID(course_id)) {
            return createErrorResponse(
                'Missing or invalid course ID',
                400,
                ErrorCodes.MISSING_FIELDS
            );
        }

        // Get environment variables with validation
        let secretKey: string;
        let serviceRoleKey: string;

        try {
            secretKey = getRequiredEnv('PAYSTACK_SECRET_KEY');
            serviceRoleKey = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY');
        } catch (error) {
            console.error('Missing required environment variables:', error);
            return createErrorResponse(
                'Payment provider not configured',
                500,
                ErrorCodes.INTERNAL_ERROR
            );
        }

        // Create Supabase clients
        const cookieStore = await cookies();

        // User client for authentication check
        const supabase = createServerClient(
            getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
            getRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            );
                        } catch {
                            // Ignore cookie errors in route handlers
                        }
                    },
                },
            }
        );

        // Get authenticated user
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return createErrorResponse(
                'User not authenticated',
                401,
                ErrorCodes.UNAUTHORIZED
            );
        }

        // Rate limiting per user
        const rateLimitResult = checkRateLimit(
            `payment-verify:${user.id}`,
            {
                maxRequests: 10,
                windowMs: 60000, // 1 minute
                blockDurationMs: 300000, // 5 minutes
            }
        );

        if (!rateLimitResult.allowed) {
            return createErrorResponse(
                'Too many requests. Please try again later.',
                429,
                ErrorCodes.RATE_LIMIT_EXCEEDED,
                {
                    resetAt: rateLimitResult.resetAt,
                    blockedUntil: rateLimitResult.blockedUntil,
                }
            );
        }

        // Admin client for database operations (bypasses RLS)
        const supabaseAdmin = createClient(
            getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
            serviceRoleKey,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            }
        );

        // Verify transaction with Paystack API
        let verifyResponse: Response;
        let verifyData: any;

        try {
            verifyResponse = await fetch(`${PAYSTACK_VERIFY_URL}/${reference}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${secretKey}`,
                    'Content-Type': 'application/json',
                },
                // Add timeout to prevent hanging requests
                signal: AbortSignal.timeout(10000), // 10 seconds
            });

            if (!verifyResponse.ok) {
                console.error('Paystack API error:', verifyResponse.status, verifyResponse.statusText);
                return createErrorResponse(
                    'Failed to verify payment with provider',
                    502,
                    ErrorCodes.EXTERNAL_API_ERROR
                );
            }

            verifyData = await verifyResponse.json();
        } catch (error: any) {
            console.error('Error calling Paystack API:', error);
            if (error.name === 'AbortError' || error.name === 'TimeoutError') {
                return createErrorResponse(
                    'Payment verification timeout',
                    504,
                    ErrorCodes.EXTERNAL_API_ERROR
                );
            }
            return createErrorResponse(
                'Failed to verify payment',
                502,
                ErrorCodes.EXTERNAL_API_ERROR
            );
        }

        // Validate Paystack response
        if (!verifyData.status) {
            console.error('Paystack verification failed:', verifyData);
            return createErrorResponse(
                verifyData.message || 'Payment verification failed',
                400,
                ErrorCodes.PAYMENT_FAILED,
                { paystackResponse: verifyData }
            );
        }

        const transaction = verifyData.data;

        // Validate transaction status
        if (transaction.status !== 'success') {
            return createErrorResponse(
                `Payment was not successful. Status: ${transaction.status}`,
                400,
                ErrorCodes.PAYMENT_FAILED,
                { status: transaction.status }
            );
        }

        // Verify course exists and get details
        const courseResult = await retryDatabaseOperation(async () =>
            await supabaseAdmin
                .from('courses')
                .select('id, title, price, is_premium')
                .eq('id', course_id)
                .single()
        );

        if (courseResult.error || !courseResult.data) {
            return createErrorResponse(
                'Course not found',
                404,
                ErrorCodes.NOT_FOUND
            );
        }

        const course = courseResult.data;

        // Validate payment amount
        // Paystack returns amount in kobo (smallest currency unit)
        const paidAmount = transaction.amount / 100;
        const expectedAmount = Number(course.price);

        // Validate amount with tolerance for floating point errors
        if (Math.abs(paidAmount - expectedAmount) > 0.01) {
            console.error('Amount mismatch:', {
                paid: paidAmount,
                expected: expectedAmount,
                reference,
                courseId: course_id,
            });

            return createErrorResponse(
                'Payment amount does not match course price',
                400,
                ErrorCodes.PAYMENT_FAILED,
                {
                    paid: paidAmount,
                    expected: expectedAmount,
                }
            );
        }

        // Validate currency
        const currencyValidation = validateCurrency(transaction.currency || 'NGN');
        if (!currencyValidation.isValid) {
            console.warn('Invalid currency:', transaction.currency);
        }

        const currency = currencyValidation.isValid
            ? (transaction.currency || 'NGN').toUpperCase()
            : 'NGN';

        // Process payment and enrollment using database function for atomicity
        try {
            const { data: result, error: rpcError } = await retryDatabaseOperation(async () =>
                await supabaseAdmin.rpc('process_payment_enrollment', {
                    p_user_id: user.id,
                    p_course_id: course_id,
                    p_amount: paidAmount,
                    p_currency: currency,
                    p_provider: 'paystack',
                    p_provider_reference: reference.toString(),
                })
            );

            if (rpcError) {
                console.error('Database RPC error:', rpcError);
                return createErrorResponse(
                    'Failed to process enrollment',
                    500,
                    ErrorCodes.ENROLLMENT_FAILED,
                    { error: rpcError.message }
                );
            }

            // Check if already enrolled (idempotent response)
            if (result?.already_enrolled) {
                return createSuccessResponse(
                    {
                        enrollment_id: result.enrollment_id,
                        payment_id: result.payment_id,
                        already_enrolled: true,
                    },
                    200,
                    'Already enrolled in this course'
                );
            }

            // Success response
            return createSuccessResponse(
                {
                    enrollment_id: result.enrollment_id,
                    payment_id: result.payment_id,
                    course_title: course.title,
                },
                200,
                'Payment verified and enrollment complete'
            );
        } catch (error: any) {
            // Handle unique constraint violations gracefully
            if (error?.code === '23505') {
                // Duplicate payment or enrollment detected
                // Fetch existing records with proper error checking
                const existingPayment = await supabaseAdmin
                    .from('payments')
                    .select('id')
                    .eq('provider_reference', reference.toString())
                    .single();

                const existingEnrollment = await supabaseAdmin
                    .from('enrollments')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('course_id', course_id)
                    .eq('status', 'active')
                    .single();

                // Check if queries succeeded and have data
                if (existingPayment.error && existingPayment.error.code !== 'PGRST116') {
                    // Query error (PGRST116 = no rows found, which is acceptable)
                    console.error('Error fetching existing payment:', existingPayment.error);
                    // Continue - we'll return what we have
                }

                if (existingEnrollment.error && existingEnrollment.error.code !== 'PGRST116') {
                    // Query error (PGRST116 = no rows found, which is acceptable)
                    console.error('Error fetching existing enrollment:', existingEnrollment.error);
                    // Continue - we'll return what we have
                }

                // Verify we have at least the enrollment (required)
                // Payment might not exist if only enrollment constraint was violated
                const paymentId = existingPayment.data?.id || null;
                const enrollmentId = existingEnrollment.data?.id;

                if (!enrollmentId) {
                    // This shouldn't happen if we hit a 23505 on enrollments
                    // But handle it gracefully
                    console.warn('Unique constraint violation but enrollment not found:', {
                        userId: user.id,
                        courseId: course_id,
                        reference,
                    });

                    // Retry the RPC call - it should handle this correctly
                    const retryResult = await retryDatabaseOperation(async () =>
                        await supabaseAdmin.rpc('process_payment_enrollment', {
                            p_user_id: user.id,
                            p_course_id: course_id,
                            p_amount: paidAmount,
                            p_currency: currency,
                            p_provider: 'paystack',
                            p_provider_reference: reference.toString(),
                        })
                    );

                    if (retryResult.error) {
                        throw retryResult.error;
                    }

                    return createSuccessResponse(
                        {
                            enrollment_id: retryResult.data?.enrollment_id,
                            payment_id: retryResult.data?.payment_id,
                            already_enrolled: retryResult.data?.already_enrolled || false,
                        },
                        200,
                        retryResult.data?.already_enrolled
                            ? 'Payment already processed and enrollment exists'
                            : 'Payment verified and enrollment complete'
                    );
                }

                // Success - return existing records
                return createSuccessResponse(
                    {
                        enrollment_id: enrollmentId,
                        payment_id: paymentId,
                        already_enrolled: true,
                    },
                    200,
                    'Payment already processed and enrollment exists'
                );
            }

            throw error; // Re-throw other errors
        }
    } catch (error: any) {
        // Global error handler
        console.error('Payment verification error:', error);

        // Don't expose internal error details in production
        const errorMessage = process.env.NODE_ENV === 'development'
            ? error.message || 'Internal server error'
            : 'An error occurred while processing your payment. Please contact support.';

        return createErrorResponse(
            errorMessage,
            500,
            ErrorCodes.INTERNAL_ERROR,
            process.env.NODE_ENV === 'development' ? { error: error.stack } : undefined
        );
    }
}
