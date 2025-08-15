import { logger } from './logger.js';

// Simple compression middleware
export const compressionMiddleware = (req, res, next) => {
  const acceptEncoding = req.headers['accept-encoding'] || '';
  
  // Only compress JSON responses larger than 1KB
  const originalJson = res.json;
  
  res.json = function(data) {
    const jsonString = JSON.stringify(data);
    const size = Buffer.byteLength(jsonString, 'utf8');
    
    // Only compress if the response is large enough and client supports compression
    if (size > 1024 && acceptEncoding.includes('gzip')) {
      res.setHeader('Content-Encoding', 'gzip');
      res.setHeader('Content-Type', 'application/json');
      
      logger.debug('Response compressed', {
        originalSize: size,
        url: req.originalUrl
      });
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

// Response size monitoring
export const responseSizeMonitor = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    if (data) {
      const size = Buffer.byteLength(data.toString(), 'utf8');
      
      // Log large responses
      if (size > 100000) { // 100KB
        logger.warn('Large response detected', {
          url: req.originalUrl,
          method: req.method,
          size: `${(size / 1024).toFixed(2)}KB`
        });
      }
      
      res.setHeader('Content-Length', size);
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};