// === K8pilot API Response Cache ===
// In-memory TTL cache to avoid redundant K8s API calls.
// Many endpoints (capacity, pod-health, benchmark, incidents) all call
// listPodForAllNamespaces() independently. This cache deduplicates them.

const cache = new Map();
const DEFAULT_TTL = 10000; // 10 seconds

/**
 * Execute a K8s API call with in-memory caching.
 * If the same key was called within TTL ms, returns cached data instantly.
 * 
 * @param {string} key - Unique cache key (e.g. 'pods-all', 'nodes')
 * @param {Function} fn - Async function that fetches data
 * @param {number} ttl - Cache TTL in ms (default 10s)
 * @returns {Promise<any>} - Cached or fresh data
 */
async function cachedCall(key, fn, ttl = DEFAULT_TTL) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < ttl) {
    return entry.data;
  }
  
  // If there's already an in-flight request for this key, await it
  if (entry && entry.promise) {
    return entry.promise;
  }

  const promise = fn().then(data => {
    cache.set(key, { data, ts: Date.now(), promise: null });
    return data;
  }).catch(err => {
    cache.delete(key);
    throw err;
  });

  cache.set(key, { data: entry?.data, ts: entry?.ts || 0, promise });
  return promise;
}

/**
 * Invalidate one or all cache entries.
 * @param {string} [key] - Specific key to invalidate. If omitted, clears all.
 */
function invalidateCache(key) {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

/**
 * Get cache stats for debugging.
 */
function getCacheStats() {
  const entries = [];
  cache.forEach((v, k) => {
    entries.push({ key: k, age: Date.now() - v.ts, hasData: !!v.data });
  });
  return { size: cache.size, entries };
}

module.exports = { cachedCall, invalidateCache, getCacheStats };
