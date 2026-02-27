// =============================================================================
// Server-Side Cache
// =============================================================================
// In-memory cache using node-cache for Spotify API responses.
// Different TTLs are used depending on how frequently data changes.
// =============================================================================

import NodeCache from "node-cache";

/** TTL for search results: 1 hour (results can change as new podcasts appear) */
export const SEARCH_TTL = 3600;

/** TTL for show (podcast) details: 24 hours (metadata changes infrequently) */
export const SHOW_TTL = 86400;

/** TTL for episode details: 24 hours (episode data is essentially immutable) */
export const EPISODE_TTL = 86400;

/**
 * Shared cache instance. Using `checkperiod` of 120 seconds to periodically
 * purge expired keys and free memory.
 */
const cache = new NodeCache({
  stdTTL: SEARCH_TTL,
  checkperiod: 120,
  useClones: false, // Avoid cloning for better performance with read-only data
});

/**
 * Retrieve a cached value by key.
 *
 * @returns The cached value or `undefined` if the key does not exist or has expired.
 */
export function getCached<T>(key: string): T | undefined {
  return cache.get<T>(key);
}

/**
 * Store a value in the cache.
 *
 * @param key   - Cache key
 * @param value - Value to store
 * @param ttl   - Time-to-live in seconds
 */
export function setCached<T>(key: string, value: T, ttl: number): void {
  cache.set(key, value, ttl);
}

/**
 * Remove a specific key from the cache.
 */
export function deleteCached(key: string): void {
  cache.del(key);
}

/**
 * Flush the entire cache.
 */
export function flushCache(): void {
  cache.flushAll();
}

export default cache;
