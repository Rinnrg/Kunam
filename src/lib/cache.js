/**
 * Simple in-memory cache for API responses
 * Helps reduce database queries for frequently accessed data
 */

class Cache {
  constructor() {
    this.cache = new Map();
    this.timestamps = new Map();
  }

  /**
   * Get cached value
   * @param {string} key - Cache key
   * @param {number} ttl - Time to live in seconds (default: 60)
   * @returns {any|null} - Cached value or null if expired/not found
   */
  get(key, ttl = 60) {
    if (!this.cache.has(key)) {
      return null;
    }

    const timestamp = this.timestamps.get(key);
    const now = Date.now();

    // Check if cache has expired
    if (now - timestamp > ttl * 1000) {
      this.delete(key);
      return null;
    }

    return this.cache.get(key);
  }

  /**
   * Set cache value
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   */
  set(key, value) {
    this.cache.set(key, value);
    this.timestamps.set(key, Date.now());
  }

  /**
   * Delete cache entry
   * @param {string} key - Cache key
   */
  delete(key) {
    this.cache.delete(key);
    this.timestamps.delete(key);
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
    this.timestamps.clear();
  }

  /**
   * Get cache size
   * @returns {number} - Number of cached entries
   */
  size() {
    return this.cache.size;
  }
}

// Export singleton instance
const cache = new Cache();

// Auto cleanup every 5 minutes
if (typeof window === 'undefined') {
  setInterval(() => {
    const now = Date.now();
    const keysToDelete = [];
    
    // Collect keys to delete using Array.from
    Array.from(cache.timestamps.entries()).forEach(([key, timestamp]) => {
      // Remove entries older than 10 minutes
      if (now - timestamp > 10 * 60 * 1000) {
        keysToDelete.push(key);
      }
    });
    
    // Delete old entries
    keysToDelete.forEach((key) => cache.delete(key));
  }, 5 * 60 * 1000);
}

export default cache;
