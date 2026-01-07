import { NextResponse } from 'next/server';

/**
 * Standardized API error response structure
 */
export interface ApiErrorResponse {
    error: string;
    code?: string;
    details?: any;
    timestamp?: string;
}

/**
 * Standardized API success response structure
 */
export interface ApiSuccessResponse<T = any> {
    success: true;
    data?: T;
    message?: string;
}

/**
 * Creates a standardized error response
 * 
 * @param error - Error message
 * @param statusCode - HTTP status code (default: 500)
 * @param code - Error code for client-side handling (optional)
 * @param details - Additional error details (only shown in development)
 * @returns NextResponse with error JSON
 */
export function createErrorResponse(
    error: string,
    statusCode: number = 500,
    code?: string,
    details?: any
): NextResponse {
    const response: ApiErrorResponse = {
        error,
        code,
        timestamp: new Date().toISOString(),
    };

    // Only include details in development
    if (process.env.NODE_ENV === 'development' && details) {
        response.details = details;
    }

    return NextResponse.json(response, { status: statusCode });
}

/**
 * Creates a standardized success response
 * 
 * @param data - Response data
 * @param statusCode - HTTP status code (default: 200)
 * @param message - Success message (optional)
 * @returns NextResponse with success JSON
 */
export function createSuccessResponse<T>(
    data?: T,
    statusCode: number = 200,
    message?: string
): NextResponse {
    const response: ApiSuccessResponse<T> = {
        success: true,
    };

    if (data !== undefined) {
        response.data = data;
    }

    if (message) {
        response.message = message;
    }

    return NextResponse.json(response, { status: statusCode });
}

/**
 * Common error codes
 */
export const ErrorCodes = {
    MISSING_FIELDS: 'MISSING_FIELDS',
    INVALID_INPUT: 'INVALID_INPUT',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    CONFLICT: 'CONFLICT',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    PAYMENT_FAILED: 'PAYMENT_FAILED',
    ENROLLMENT_FAILED: 'ENROLLMENT_FAILED',
    DATABASE_ERROR: 'DATABASE_ERROR',
    EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

