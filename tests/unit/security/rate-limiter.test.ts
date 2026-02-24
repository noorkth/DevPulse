import { RateLimiter, RateLimitError, RateLimiterPresets } from '../../../electron/security/rate-limiter';

describe('RateLimiter', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('Basic Functionality', () => {
        it('should allow requests within limit', () => {
            const limiter = new RateLimiter(5, 1000); // 5 requests per second
            const clientId = 'test-client';

            expect(limiter.isAllowed(clientId)).toBe(true);
            expect(limiter.isAllowed(clientId)).toBe(true);
            expect(limiter.isAllowed(clientId)).toBe(true);
        });

        it('should block requests exceeding limit', () => {
            const limiter = new RateLimiter(3, 1000); // 3 requests per second
            const clientId = 'test-client';

            // First 3 should pass
            expect(limiter.isAllowed(clientId)).toBe(true);
            expect(limiter.isAllowed(clientId)).toBe(true);
            expect(limiter.isAllowed(clientId)).toBe(true);

            // 4th should fail
            expect(limiter.isAllowed(clientId)).toBe(false);
        });

        it('should reset after window expires', () => {
            const limiter = new RateLimiter(2, 1000); // 2 requests per second
            const clientId = 'test-client';

            // Use up quota
            expect(limiter.isAllowed(clientId)).toBe(true);
            expect(limiter.isAllowed(clientId)).toBe(true);
            expect(limiter.isAllowed(clientId)).toBe(false);

            // Advance time past window
            jest.advanceTimersByTime(1100);

            // Should be allowed again
            expect(limiter.isAllowed(clientId)).toBe(true);
        });
    });

    describe('Multiple Clients', () => {
        it('should track different clients separately', () => {
            const limiter = new RateLimiter(2, 1000);

            expect(limiter.isAllowed('client1')).toBe(true);
            expect(limiter.isAllowed('client1')).toBe(true);
            expect(limiter.isAllowed('client1')).toBe(false); // Client1 blocked

            // Client2 should still be allowed
            expect(limiter.isAllowed('client2')).toBe(true);
            expect(limiter.isAllowed('client2')).toBe(true);
            expect(limiter.isAllowed('client2')).toBe(false); // Client2 blocked
        });
    });

    describe('Sliding Window', () => {
        it('should implement sliding window algorithm', () => {
            const limiter = new RateLimiter(3, 1000);
            const clientId = 'sliding-test';

            // Make 2 requests at t=0
            expect(limiter.isAllowed(clientId)).toBe(true);
            expect(limiter.isAllowed(clientId)).toBe(true);

            // Advance 600ms
            jest.advanceTimersByTime(600);

            // Make 1 more request at t=600 (3 total)
            expect(limiter.isAllowed(clientId)).toBe(true);

            // Should be blocked (3 requests in last 1000ms)
            expect(limiter.isAllowed(clientId)).toBe(false);

            // Advance another 500ms (t=1100, first 2 requests expired)
            jest.advanceTimersByTime(500);

            // Should be allowed now (only 1 request in window)
            expect(limiter.isAllowed(clientId)).toBe(true);
        });
    });

    describe('RateLimiterPresets', () => {
        it('should have READ preset', () => {
            expect(RateLimiterPresets.READ).toBeDefined();
            expect(RateLimiterPresets.READ.maxRequests).toBeGreaterThan(0);
            expect(RateLimiterPresets.READ.windowMs).toBeGreaterThan(0);
        });

        it('should have WRITE preset', () => {
            expect(RateLimiterPresets.WRITE).toBeDefined();
            expect(RateLimiterPresets.WRITE.maxRequests).toBeGreaterThan(0);
            expect(RateLimiterPresets.WRITE.windowMs).toBeGreaterThan(0);
        });

        it('WRITE should be more restrictive than READ', () => {
            const readRate = RateLimiterPresets.READ.maxRequests / RateLimiterPresets.READ.windowMs;
            const writeRate = RateLimiterPresets.WRITE.maxRequests / RateLimiterPresets.WRITE.windowMs;
            expect(writeRate).toBeLessThanOrEqual(readRate);
        });
    });

    describe('RateLimitError', () => {
        it('should be throwable', () => {
            expect(() => {
                throw new RateLimitError('Too many requests');
            }).toThrow(RateLimitError);
        });

        it('should have correct message', () => {
            const error = new RateLimitError('Custom message');
            expect(error.message).toBe('Custom message');
        });
    });

    describe('Edge Cases', () => {
        it('should handle very small windows', () => {
            const limiter = new RateLimiter(1, 10); // 1 request per 10ms
            expect(limiter.isAllowed('test')).toBe(true);
            expect(limiter.isAllowed('test')).toBe(false);

            jest.advanceTimersByTime(11);
            expect(limiter.isAllowed('test')).toBe(true);
        });

        it('should handle high request limits', () => {
            const limiter = new RateLimiter(1000, 1000);
            const clientId = 'bulk-test';

            for (let i = 0; i < 1000; i++) {
                expect(limiter.isAllowed(clientId)).toBe(true);
            }

            expect(limiter.isAllowed(clientId)).toBe(false);
        });
    });
});
