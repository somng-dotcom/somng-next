/**
 * Simple in-memory rate limiting for production use
 * For production at scale, consider using Redis-based rate limiting (e.g., Upstash)
 */

interface RateLimitRecord {
    count: number;
    resetAt: number;
    blocked: boolean;
    blockedUntil?: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

/**
 * Configuration for rate limiting
 */
export interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
    blockDurationMs?: number; // Duration to block after exceeding limit
}

const DEFAULT_CONFIG: Required<RateLimitConfig> = {
    maxRequests: 10,
    windowMs: 60000, // 1 minute
    blockDurationMs: 300000, // 5 minutes
};

/**
 * Checks if a request should be rate limited
 * 
 * @param identifier - Unique identifier for rate limiting (e.g., user ID, IP address)
 * @param config - Rate limit configuration
 * @returns Object with allowed status and remaining requests
 */
export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig = DEFAULT_CONFIG
): { allowed: boolean; remaining: number; resetAt: number; blockedUntil?: number } {
    const now = Date.now();
    const {
        maxRequests,
        windowMs,
        blockDurationMs = DEFAULT_CONFIG.blockDurationMs,
    } = config;

    let record = rateLimitMap.get(identifier);

    // Clean up expired records
    if (record && now > record.resetAt && (!record.blockedUntil || now > record.blockedUntil)) {
        rateLimitMap.delete(identifier);
        record = undefined;
    }

    // If blocked, check if block period has expired
    if (record?.blocked && record.blockedUntil) {
        if (now < record.blockedUntil) {
            return {
                allowed: false,
                remaining: 0,
                resetAt: record.resetAt,
                blockedUntil: record.blockedUntil,
            };
        } else {
            // Block expired, reset record
            rateLimitMap.delete(identifier);
            record = undefined;
        }
    }

    // Create or update record
    if (!record || now > record.resetAt) {
        // New window
        record = {
            count: 1,
            resetAt: now + windowMs,
            blocked: false,
        };
        rateLimitMap.set(identifier, record);
        return {
            allowed: true,
            remaining: maxRequests - 1,
            resetAt: record.resetAt,
        };
    }

    // Increment count
    record.count++;

    // Check if limit exceeded
    if (record.count > maxRequests) {
        // Block the identifier
        record.blocked = true;
        record.blockedUntil = now + blockDurationMs;
        rateLimitMap.set(identifier, record);

        return {
            allowed: false,
            remaining: 0,
            resetAt: record.resetAt,
            blockedUntil: record.blockedUntil,
        };
    }

    // Update record
    rateLimitMap.set(identifier, record);

    return {
        allowed: true,
        remaining: maxRequests - record.count,
        resetAt: record.resetAt,
    };
}

/**
 * Clears rate limit for an identifier (useful for testing or manual reset)
 */
export function clearRateLimit(identifier: string): void {
    rateLimitMap.delete(identifier);
}

/**
 * Clears all rate limits (useful for testing)
 */
export function clearAllRateLimits(): void {
    rateLimitMap.clear();
}

/**
 * Gets current rate limit status for an identifier
 */
export function getRateLimitStatus(identifier: string): {
    count: number;
    resetAt: number;
    blocked: boolean;
    blockedUntil?: number;
} | null {
    const record = rateLimitMap.get(identifier);
    if (!record) {
        return null;
    }

    const now = Date.now();
    if (now > record.resetAt && (!record.blockedUntil || now > record.blockedUntil)) {
        return null;
    }

    return {
        count: record.count,
        resetAt: record.resetAt,
        blocked: record.blocked || false,
        blockedUntil: record.blockedUntil,
    };
}

// Cleanup old entries periodically (every 5 minutes)
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        for (const [key, record] of rateLimitMap.entries()) {
            if (now > record.resetAt && (!record.blockedUntil || now > record.blockedUntil)) {
                rateLimitMap.delete(key);
            }
        }
    }, 5 * 60 * 1000);
}

