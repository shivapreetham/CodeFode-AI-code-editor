import express from "express";
import cors from 'cors';
import { app, server } from "./socket/initsocket.js";
import userRoutes from './routes/userRoutes.js';
import workspaceRouters from './routes/workspaceRoutes.js';
import connectDB from "./db/dbconn.js";
import aiRoutes from './routes/aiRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

// Import middleware and configuration
import config, { validateEnvironment } from './config/environment.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger, logger } from './middleware/logger.js';
import { sanitize } from './middleware/validation.js';
import { apiLimiter, corsOptions, basicSecurity } from './middleware/security.js';
import { compressionMiddleware, responseSizeMonitor } from './middleware/compression.js';
import { getCacheStats } from './middleware/cache.js';

// Validate environment configuration
validateEnvironment();

// Global middleware setup
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors(corsOptions));
app.use(basicSecurity);
app.use(requestLogger);
app.use(sanitize);
app.use(compressionMiddleware);
app.use(responseSizeMonitor);
app.use('/api/', apiLimiter);

// API routes
app.use('/api/user', userRoutes);
app.use('/api/workspace', workspaceRouters);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check and monitoring endpoints
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: config.server.nodeEnv,
    version: '1.0.0'
  });
});

app.get('/api/stats', (req, res) => {
  res.json({
    cache: getCacheStats(),
    memory: process.memoryUsage(),
    uptime: process.uptime()
  });
});

// Connect to database
connectDB(config.database.mongoUri);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "CodeFode AI Code Editor API",
    version: "1.0.0",
    environment: config.server.nodeEnv,
    documentation: "/api/docs",
    health: "/health"
  });
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Start server
server.listen(config.server.port, () => {
  logger.info(`🚀 Server started successfully`, {
    port: config.server.port,
    environment: config.server.nodeEnv,
    url: `http://localhost:${config.server.port}`,
    features: {
      websockets: true,
      aiIntegration: !!config.ai.cohereApiKey,
      security: true,
      caching: true,
      logging: true
    }
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});
