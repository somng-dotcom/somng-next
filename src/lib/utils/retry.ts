/**
 * Retry utility for handling transient failures in production
 * Useful for database operations, API calls, and network requests
 */

export interface RetryOptions {
    maxRetries?: number;
    delayMs?: number;
    backoffMultiplier?: number;
    shouldRetry?: (error: any) => boolean;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'shouldRetry'>> = {
    maxRetries: 3,
    delayMs: 1000,
    backoffMultiplier: 2,
};

/**
 * Retries an operation with exponential backoff
 * 
 * @param operation - Async function to retry
 * @param options - Retry configuration options
 * @returns Result of the operation
 * @throws Last error if all retries fail
 */
export async function retryOperation<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const {
        maxRetries = DEFAULT_OPTIONS.maxRetries,
        delayMs = DEFAULT_OPTIONS.delayMs,
        backoffMultiplier = DEFAULT_OPTIONS.backoffMultiplier,
        shouldRetry = defaultShouldRetry,
    } = options;

    let lastError: Error | unknown;
    let currentDelay = delayMs;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;

            // Don't retry if it's not a retryable error
            if (!shouldRetry(error)) {
                throw error;
            }

            // Don't wait after the last attempt
            if (attempt < maxRetries) {
                // Wait before retrying with exponential backoff
                await new Promise(resolve => setTimeout(resolve, currentDelay));
                currentDelay *= backoffMultiplier;
            }
        }
    }

    // All retries exhausted
    throw lastError;
}

/**
 * Default function to determine if an error should be retried
 * Retries on network errors, timeouts, and 5xx server errors
 * Does not retry on client errors (4xx) or validation errors
 */
function defaultShouldRetry(error: any): boolean {
    // Network errors
    if (error?.code === 'ECONNRESET' || 
        error?.code === 'ETIMEDOUT' || 
        error?.code === 'ENOTFOUND') {
        return true;
    }

    // Supabase/PostgreSQL errors that are retryable
    if (error?.code === 'PGRST301' || // Timeout
        error?.code === '50000' ||     // Internal error
        error?.code === '08006' ||     // Connection failure
        error?.message?.includes('timeout') ||
        error?.message?.includes('connection')) {
        return true;
    }

    // HTTP 5xx errors (server errors) - retry
    if (error?.status >= 500 && error?.status < 600) {
        return true;
    }

    // HTTP 429 (Too Many Requests) - retry
    if (error?.status === 429) {
        return true;
    }

    // Client errors (4xx) - don't retry
    if (error?.status >= 400 && error?.status < 500) {
        return false;
    }

    // Validation errors - don't retry
    if (error?.code === '23514' || // Check constraint violation
        error?.code === '23505') { // Unique constraint violation
        return false;
    }

    // Default: retry on unknown errors (could be transient)
    return true;
}

/**
 * Retries a database operation with specific handling for Supabase errors
 */
export async function retryDatabaseOperation<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    return retryOperation(operation, {
        ...options,
        shouldRetry: (error) => {
            // Use custom retry logic if provided
            if (options.shouldRetry) {
                return options.shouldRetry(error);
            }

            // Supabase-specific retry logic
            const errorCode = error?.code;
            const errorMessage = error?.message?.toLowerCase() || '';

            // Retry on connection/network errors
            if (errorCode === 'PGRST301' || // Request timeout
                errorCode === '08006' ||     // Connection failure
                errorMessage.includes('timeout') ||
                errorMessage.includes('connection') ||
                errorMessage.includes('network')) {
                return true;
            }

            // Don't retry on validation/constraint errors
            if (errorCode?.startsWith('23')) { // PostgreSQL class 23 errors
                return false;
            }

            // Don't retry on authentication errors
            if (errorCode === 'PGRST301' || errorMessage.includes('authentication')) {
                return false;
            }

            // Default: use default retry logic
            return defaultShouldRetry(error);
        },
    });
}

