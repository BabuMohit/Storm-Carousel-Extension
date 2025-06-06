/**
 * Screenshot Cache Manager
 * 
 * Manages the caching of screenshot data using chrome.storage.session.
 * Provides methods for saving, retrieving, and clearing cached screenshots.
 * 
 * Features:
 * - Session-based caching (persists until browser closes)
 * - Automatic timestamp tracking
 * - Error handling for storage limits
 */

class CacheManager {
    /**
     * Creates a new CacheManager instance
     * Initializes with a constant cache key for storage
     */
    constructor() {
        this.CACHE_KEY = 'screenshotCache';
    }

    /**
     * Saves screenshot data to the cache
     * Includes timestamp for potential cache invalidation
     * 
     * @param {string} url - The URL of the page that was screenshot
     * @param {string} imageData - The screenshot data (base64 encoded)
     * @returns {Promise<void>}
     * @throws {Error} If storage fails or quota is exceeded
     */
    async saveToCache(url, imageData) {
        try {
            const cache = await this.getCache();
            cache[url] = {
                data: imageData,
                timestamp: Date.now()
            };
            await chrome.storage.session.set({ [this.CACHE_KEY]: cache });
            console.log('Saved to cache:', url);
        } catch (error) {
            console.error('Error saving to cache:', error);
        }
    }

    /**
     * Retrieves screenshot data from the cache
     * 
     * @param {string} url - The URL to retrieve screenshot data for
     * @returns {Promise<string|null>} The cached screenshot data or null if not found
     */
    async getFromCache(url) {
        try {
            const cache = await this.getCache();
            return cache[url]?.data || null;
        } catch (error) {
            console.error('Error reading from cache:', error);
            return null;
        }
    }

    /**
     * Retrieves the entire cache object
     * Creates an empty cache if none exists
     * 
     * @returns {Promise<Object>} The cache object
     */
    async getCache() {
        const result = await chrome.storage.session.get(this.CACHE_KEY);
        return result[this.CACHE_KEY] || {};
    }

    /**
     * Clears all cached screenshots
     * Useful for handling storage quota errors or manual cache clearing
     * 
     * @returns {Promise<void>}
     */
    async clearCache() {
        try {
            await chrome.storage.session.remove(this.CACHE_KEY);
            console.log('Cache cleared');
        } catch (error) {
            console.error('Error clearing cache:', error);
        }
    }
}

// Create a singleton instance for use throughout the extension
const cacheManager = new CacheManager(); 