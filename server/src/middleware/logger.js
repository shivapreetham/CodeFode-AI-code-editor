import fs from 'fs';
import path from 'path';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log levels
const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

// Logger class
class Logger {
  constructor() {
    this.logFile = path.join(logsDir, `app-${new Date().toISOString().split('T')[0]}.log`);
    this.errorFile = path.join(logsDir, `error-${new Date().toISOString().split('T')[0]}.log`);
  }

  formatLog(level, message, meta = {}) {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta
    }) + '\n';
  }

  writeToFile(file, content) {
    try {
      fs.appendFileSync(file, content);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  log(level, message, meta = {}) {
    const logEntry = this.formatLog(level, message, meta);
    
    // Always write to main log file
    this.writeToFile(this.logFile, logEntry);
    
    // Write errors to separate error file
    if (level === LOG_LEVELS.ERROR) {
      this.writeToFile(this.errorFile, logEntry);
    }
    
    // Console output with colors
    const colors = {
      ERROR: '\x1b[31m',
      WARN: '\x1b[33m',
      INFO: '\x1b[36m',
      DEBUG: '\x1b[90m'
    };
    
    const reset = '\x1b[0m';
    const color = colors[level] || '';
    
    console.log(`${color}[${level}] ${new Date().toISOString()} - ${message}${reset}`);
    
    if (Object.keys(meta).length > 0) {
      console.log(`${color}Meta:${reset}`, meta);
    }
  }

  error(message, meta = {}) {
    this.log(LOG_LEVELS.ERROR, message, meta);
  }

  warn(message, meta = {}) {
    this.log(LOG_LEVELS.WARN, message, meta);
  }

  info(message, meta = {}) {
    this.log(LOG_LEVELS.INFO, message, meta);
  }

  debug(message, meta = {}) {
    if (process.env.NODE_ENV === 'development') {
      this.log(LOG_LEVELS.DEBUG, message, meta);
    }
  }
}

// Create logger instance
export const logger = new Logger();

// Request logging middleware
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  const originalSend = res.send;
  
  // Override res.send to capture response
  res.send = function(body) {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    
    // Log request details
    logger.info('HTTP Request', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      statusCode,
      duration: `${duration}ms`,
      contentLength: body ? body.length : 0
    });
    
    // Log errors (4xx and 5xx status codes)
    if (statusCode >= 400) {
      logger.error('HTTP Error Response', {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip || req.connection.remoteAddress,
        statusCode,
        duration: `${duration}ms`,
        body: statusCode >= 500 ? body : undefined // Only log body for server errors
      });
    }
    
    originalSend.call(this, body);
  };
  
  next();
};

// Socket event logging
export const logSocketEvent = (event, socketId, data = {}) => {
  logger.info('Socket Event', {
    event,
    socketId,
    ...data
  });
};

// Database operation logging
export const logDatabaseOperation = (operation, collection, data = {}) => {
  logger.debug('Database Operation', {
    operation,
    collection,
    ...data
  });
};

// Error logging helper
export const logError = (error, context = {}) => {
  logger.error(error.message || 'Unknown error', {
    name: error.name,
    stack: error.stack,
    ...context
  });
};