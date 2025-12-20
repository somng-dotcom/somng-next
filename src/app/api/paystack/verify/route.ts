
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const PAYSTACK_VERIFY_URL = 'https://api.paystack.co/transaction/verify';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { reference, course_id } = body;

        if (!reference || !course_id) {
            return NextResponse.json(
                { error: 'Missing reference or course_id' },
                { status: 400 }
            );
        }

        const secretKey = process.env.PAYSTACK_SECRET_KEY;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!secretKey) {
            console.error('PAYSTACK_SECRET_KEY not configured');
            return NextResponse.json(
                { error: 'Payment provider not configured' },
                { status: 500 }
            );
        }

        if (!serviceRoleKey) {
            console.error('SUPABASE_SERVICE_ROLE_KEY not configured');
            return NextResponse.json(
                { error: 'System configuration error' },
                { status: 500 }
            );
        }

        // 1. Verify transaction with Paystack
        const verifyResponse = await fetch(`${PAYSTACK_VERIFY_URL}/${reference}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${secretKey}`,
                'Content-Type': 'application/json',
            },
        });

        const verifyData = await verifyResponse.json();

        if (!verifyData.status) {
            console.error('Paystack verification failed:', verifyData);
            return NextResponse.json(
                { error: 'Payment verification failed', details: verifyData.message },
                { status: 400 }
            );
        }

        const transaction = verifyData.data;

        // 2. Check transaction status
        if (transaction.status !== 'success') {
            return NextResponse.json(
                { error: 'Payment was not successful', status: transaction.status },
                { status: 400 }
            );
        }

        // 3. Create Supabase clients
        // User client for auth check
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll(); },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            );
                        } catch { }
                    },
                },
            }
        );

        // Admin client for DB operations (Bypass RLS)
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceRoleKey,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        // 4. Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json(
                { error: 'User not authenticated' },
                { status: 401 }
            );
        }

        // 5. Verify course exists and price matches (Use Admin client)
        const { data: course, error: courseError } = await supabaseAdmin
            .from('courses')
            .select('id, title, price, is_premium')
            .eq('id', course_id)
            .single();

        if (courseError || !course) {
            return NextResponse.json(
                { error: 'Course not found' },
                { status: 404 }
            );
        }

        // Verify amount matches (Paystack amount is in kobo)
        const paidAmount = transaction.amount / 100;
        const expectedAmount = course.price;

        if (Math.abs(paidAmount - expectedAmount) > 0.01) {
            console.error('Amount mismatch:', { paid: paidAmount, expected: expectedAmount });
            return NextResponse.json(
                { error: 'Payment amount does not match course price' },
                { status: 400 }
            );
        }

        // 6. Check if already enrolled
        const { data: existingEnrollment } = await supabaseAdmin
            .from('enrollments')
            .select('id')
            .eq('user_id', user.id)
            .eq('course_id', course_id)
            .single();

        if (existingEnrollment) {
            return NextResponse.json(
                { success: true, message: 'Already enrolled', enrollment_id: existingEnrollment.id }
            );
        }

        // 7. Record payment (Use Admin client)
        // Check if payment already exists (idempotency)
        const { data: existingPayment } = await supabaseAdmin
            .from('payments')
            .select('id')
            .eq('provider_reference', reference.toString())
            .single();

        let paymentId = existingPayment?.id;

        if (!existingPayment) {
            const { data: payment, error: paymentError } = await supabaseAdmin
                .from('payments')
                .insert({
                    user_id: user.id,
                    course_id: course_id,
                    amount: paidAmount,
                    currency: transaction.currency,
                    provider: 'paystack',
                    provider_reference: reference.toString(),
                    status: 'success',
                    paid_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (paymentError) {
                console.error('Failed to record payment:', paymentError);
                // We continue to enrollment even if payment record fails, but log it critical
            } else {
                paymentId = payment?.id;
            }
        }

        // 8. Create enrollment (Use Admin client)
        const { data: enrollment, error: enrollmentError } = await supabaseAdmin
            .from('enrollments')
            .insert({
                user_id: user.id,
                course_id: course_id,
                status: 'active',
            })
            .select()
            .single();

        if (enrollmentError) {
            console.error('Failed to create enrollment:', enrollmentError);
            return NextResponse.json(
                { error: 'Failed to complete enrollment', details: enrollmentError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Payment verified and enrollment complete',
            enrollment_id: enrollment.id,
            payment_id: paymentId,
        });

    } catch (error: any) {
        console.error('Payment verification error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
