import { LRUCache } from 'lru-cache';

/**
 * Cache configuration for different data types
 */
interface CacheConfig {
    max: number; // Maximum number of items
    ttl: number; // Time to live in milliseconds
}

/**
 * Cache statistics for monitoring
 */
interface CacheStats {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    size: number;
}

/**
 * CacheManager - In-memory LRU cache for query results
 * 
 * Provides multiple cache layers with different TTLs:
 * - Level 1: IPC responses (30s TTL)
 * - Level 2: Analytics (5min TTL)
 * - Level 3: ML predictions (1hr TTL)
 */
export class CacheManager {
    private static caches: Map<string, LRUCache<string, any>> = new Map();
    private static stats: Map<string, CacheStats> = new Map();

    /**
     * Default cache configurations
     */
    private static readonly configs: Record<string, CacheConfig> = {
        ipc: { max: 100, ttl: 30 * 1000 }, // 30 seconds
        analytics: { max: 50, ttl: 5 * 60 * 1000 }, // 5 minutes
        ml: { max: 200, ttl: 60 * 60 * 1000 }, // 1 hour
        list: { max: 20, ttl: 60 * 1000 }, // 1 minute for list queries
    };

    /**
     * Initialize a cache with given name and config
     */
    private static initCache(name: string, config?: CacheConfig): void {
        if (!this.caches.has(name)) {
            const cacheConfig = config || this.configs[name] || this.configs.ipc;

            this.caches.set(
                name,
                new LRUCache<string, any>({
                    max: cacheConfig.max,
                    ttl: cacheConfig.ttl,
                })
            );

            this.stats.set(name, {
                hits: 0,
                misses: 0,
                sets: 0,
                deletes: 0,
                size: 0,
            });
        }
    }

    /**
     * Get value from cache
     */
    static get<T>(cacheName: string, key: string): T | undefined {
        this.initCache(cacheName);
        const cache = this.caches.get(cacheName)!;
        const stats = this.stats.get(cacheName)!;

        const value = cache.get(key);

        if (value !== undefined) {
            stats.hits++;
        } else {
            stats.misses++;
        }

        return value as T | undefined;
    }

    /**
     * Set value in cache
     */
    static set(cacheName: string, key: string, value: any): void {
        this.initCache(cacheName);
        const cache = this.caches.get(cacheName)!;
        const stats = this.stats.get(cacheName)!;

        cache.set(key, value);
        stats.sets++;
        stats.size = cache.size;
    }

    /**
     * Delete specific key from cache
     */
    static delete(cacheName: string, key: string): void {
        this.initCache(cacheName);
        const cache = this.caches.get(cacheName)!;
        const stats = this.stats.get(cacheName)!;

        cache.delete(key);
        stats.deletes++;
        stats.size = cache.size;
    }

    /**
     * Clear entire cache
     */
    static clear(cacheName: string): void {
        const cache = this.caches.get(cacheName);
        if (cache) {
            cache.clear();
            const stats = this.stats.get(cacheName)!;
            stats.size = 0;
        }
    }

    /**
     * Clear all caches
     */
    static clearAll(): void {
        this.caches.forEach((cache) => cache.clear());
        this.stats.forEach((stat) => {
            stat.size = 0;
        });
    }

    /**
     * Invalidate cache entries matching a pattern
     * Useful for invalidating related cache entries
     */
    static invalidatePattern(cacheName: string, pattern: RegExp): void {
        const cache = this.caches.get(cacheName);
        if (!cache) return;

        const keysToDelete: string[] = [];
        cache.forEach((_, key) => {
            if (pattern.test(key)) {
                keysToDelete.push(key);
            }
        });

        keysToDelete.forEach((key) => this.delete(cacheName, key));
    }

    /**
     * Get cache statistics
     */
    static getStats(cacheName?: string): Record<string, CacheStats> | CacheStats | null {
        if (cacheName) {
            return this.stats.get(cacheName) || null;
        }

        const allStats: Record<string, CacheStats> = {};
        this.stats.forEach((stats, name) => {
            const cache = this.caches.get(name)!;
            allStats[name] = {
                ...stats,
                size: cache.size,
            };
        });

        return allStats;
    }

    /**
     * Get cache hit rate
     */
    static getHitRate(cacheName: string): number {
        const stats = this.stats.get(cacheName);
        if (!stats) return 0;

        const total = stats.hits + stats.misses;
        return total === 0 ? 0 : Math.round((stats.hits / total) * 100);
    }

    /**
     * Generate cache key from parameters
     */
    static generateKey(prefix: string, params: any): string {
        const sortedParams = JSON.stringify(params, Object.keys(params || {}).sort());
        return `${prefix}:${sortedParams}`;
    }
}
