import { logger } from './logger.js';

// Simple in-memory cache implementation
class MemoryCache {
  constructor(defaultTTL = 300000) { // 5 minutes default
    this.cache = new Map();
    this.ttls = new Map();
    this.defaultTTL = defaultTTL;
    
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  set(key, value, ttl = this.defaultTTL) {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, value);
    this.ttls.set(key, expiresAt);
    
    logger.debug('Cache set', { key, ttl, expiresAt });
  }

  get(key) {
    const expiresAt = this.ttls.get(key);
    
    if (!expiresAt) {
      return null;
    }
    
    if (Date.now() > expiresAt) {
      this.delete(key);
      logger.debug('Cache expired', { key });
      return null;
    }
    
    const value = this.cache.get(key);
    logger.debug('Cache hit', { key });
    return value;
  }

  delete(key) {
    this.cache.delete(key);
    this.ttls.delete(key);
    logger.debug('Cache delete', { key });
  }

  clear() {
    this.cache.clear();
    this.ttls.clear();
    logger.info('Cache cleared');
  }

  cleanup() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, expiresAt] of this.ttls.entries()) {
      if (now > expiresAt) {
        this.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      logger.debug('Cache cleanup completed', { cleaned, remaining: this.cache.size });
    }
  }

  stats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// Global cache instance
const cache = new MemoryCache();

// Cache middleware factory
export const cacheMiddleware = (keyGenerator, ttl) => {
  return (req, res, next) => {
    try {
      const key = typeof keyGenerator === 'function' ? keyGenerator(req) : keyGenerator;
      const cachedData = cache.get(key);
      
      if (cachedData) {
        logger.info('Cache hit for request', { 
          method: req.method, 
          url: req.originalUrl, 
          key 
        });
        return res.json(cachedData);
      }
      
      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = function(data) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cache.set(key, data, ttl);
          logger.info('Response cached', { 
            method: req.method, 
            url: req.originalUrl, 
            key,
            ttl 
          });
        }
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      logger.error('Cache middleware error', { error: error.message });
      next();
    }
  };
};

// Predefined cache configurations
export const workspaceCache = cacheMiddleware(
  (req) => `workspace:${req.params.roomId}`,
  300000 // 5 minutes
);

export const aiResultCache = cacheMiddleware(
  (req) => `ai:${Buffer.from(req.body.code + req.body.language).toString('base64')}`,
  1800000 // 30 minutes
);

// Cache invalidation helpers
export const invalidateWorkspaceCache = (roomId) => {
  cache.delete(`workspace:${roomId}`);
  logger.info('Workspace cache invalidated', { roomId });
};

export const invalidatePattern = (pattern) => {
  const keys = Array.from(cache.cache.keys());
  const regex = new RegExp(pattern);
  
  keys.forEach(key => {
    if (regex.test(key)) {
      cache.delete(key);
    }
  });
  
  logger.info('Cache pattern invalidated', { pattern });
};

// Cache stats endpoint
export const getCacheStats = () => cache.stats();

// Cleanup on process termination
process.on('SIGTERM', () => cache.destroy());
process.on('SIGINT', () => cache.destroy());

export default cache;