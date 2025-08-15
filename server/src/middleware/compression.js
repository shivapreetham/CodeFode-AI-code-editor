import { logger } from './logger.js';
import { gzip } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);

// Simple compression middleware
export const compressionMiddleware = (req, res, next) => {
  const acceptEncoding = req.headers['accept-encoding'] || '';
  
  // Only compress JSON responses larger than 1KB
  const originalJson = res.json;
  
  res.json = async function(data) {
    const jsonString = JSON.stringify(data);
    const size = Buffer.byteLength(jsonString, 'utf8');
    
    // Only compress if the response is large enough and client supports compression
    if (size > 1024 && acceptEncoding.includes('gzip')) {
      try {
        const compressed = await gzipAsync(Buffer.from(jsonString, 'utf8'));
        
        res.setHeader('Content-Encoding', 'gzip');
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Length', compressed.length);
        
        logger.debug('Response compressed', {
          originalSize: size,
          compressedSize: compressed.length,
          url: req.originalUrl
        });
        
        return res.send(compressed);
      } catch (error) {
        logger.error('Compression failed', { error: error.message, url: req.originalUrl });
        // Fall back to uncompressed
      }
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