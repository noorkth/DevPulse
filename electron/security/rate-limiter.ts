/**
 * Token Bucket Rate Limiter for IPC handlers
 * Prevents DoS attacks by limiting requests per time window
 */

export interface RateLimiterConfig {
    maxRequests: number;
    windowMs: number;
}

export class RateLimiter {
    private buckets = new Map<string, number[]>();

    constructor(
        private readonly maxRequests: number = 100,
        private readonly windowMs: number = 60000 // 1 minute default
    ) {
        // Cleanup old entries every 5 minutes
        setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }

    /**
     * Check if a request is allowed for the given key
     * @param key - Unique identifier (e.g., sender ID or IP)
     * @returns true if request is allowed, false if rate limit exceeded
     */
    isAllowed(key: string): boolean {
        const now = Date.now();
        const timestamps = this.buckets.get(key) || [];

        // Remove timestamps outside the current window
        const validTimestamps = timestamps.filter(t => now - t < this.windowMs);

        if (validTimestamps.length >= this.maxRequests) {
            console.warn(`⚠️ Rate limit exceeded for ${key}: ${validTimestamps.length}/${this.maxRequests} requests`);
            return false;
        }

        // Add current timestamp
        validTimestamps.push(now);
        this.buckets.set(key, validTimestamps);

        return true;
    }

    /**
     * Reset rate limit for a specific key
     */
    reset(key: string): void {
        this.buckets.delete(key);
    }

    /**
     * Get current request count for a key
     */
    getRequestCount(key: string): number {
        const now = Date.now();
        const timestamps = this.buckets.get(key) || [];
        return timestamps.filter(t => now - t < this.windowMs).length;
    }

    /**
     * Get remaining requests for a key
     */
    getRemainingRequests(key: string): number {
        return Math.max(0, this.maxRequests - this.getRequestCount(key));
    }

    /**
     * Cleanup old entries to prevent memory leaks
     */
    private cleanup(): void {
        const now = Date.now();
        let cleanedCount = 0;

        for (const [key, timestamps] of this.buckets.entries()) {
            const validTimestamps = timestamps.filter(t => now - t < this.windowMs);

            if (validTimestamps.length === 0) {
                this.buckets.delete(key);
                cleanedCount++;
            } else {
                this.buckets.set(key, validTimestamps);
            }
        }

        if (cleanedCount > 0) {
            console.log(`🧹 Rate limiter cleaned up ${cleanedCount} expired entries`);
        }
    }

    /**
     * Get statistics about current rate limiter state
     */
    getStats(): { totalKeys: number; totalRequests: number } {
        let totalRequests = 0;
        const now = Date.now();

        for (const timestamps of this.buckets.values()) {
            totalRequests += timestamps.filter(t => now - t < this.windowMs).length;
        }

        return {
            totalKeys: this.buckets.size,
            totalRequests
        };
    }
}

import { AppError, ErrorCode } from '../errors';

/**
 * Custom error class for rate limit violations
 * Now extends AppError with proper error code
 */
export class RateLimitError extends AppError {
    constructor(
        message?: string,
        public readonly retryAfter?: number
    ) {
        super(
            ErrorCode.RATE_LIMIT_EXCEEDED,
            message,
            { retryAfter }
        );
        this.name = 'RateLimitError';
    }
}

/**
 * Create a rate limiter with specific configuration
 */
export function createRateLimiter(
    maxRequests: number,
    windowMs: number
): RateLimiter {
    return new RateLimiter(maxRequests, windowMs);
}

/**
 * Predefined rate limiter configurations
 */
export const RateLimiterPresets = {
    // Very restrictive: 10 requests per minute
    STRICT: { maxRequests: 10, windowMs: 60000 },

    // Normal: 100 requests per minute
    NORMAL: { maxRequests: 100, windowMs: 60000 },

    // Relaxed: 500 requests per minute
    RELAXED: { maxRequests: 500, windowMs: 60000 },

    // For read operations: 200 requests per minute
    READ: { maxRequests: 200, windowMs: 60000 },

    // For write operations: 50 requests per minute
    WRITE: { maxRequests: 50, windowMs: 60000 },

    // For analytics: 30 requests per minute
    ANALYTICS: { maxRequests: 30, windowMs: 60000 }
} as const;
