import mongoose from "mongoose";
import { logger } from "../middleware/logger.js";

mongoose.set("strictQuery", false);

const connectDB = async (uri) => {
  try {
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      logger.info("MongoDB already connected");
      return;
    }

    // Connection options
    const options = {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds
    };

    // Connect to MongoDB
    await mongoose.connect(uri, options);
    
    logger.info("✅ MongoDB connected successfully", {
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      dbName: mongoose.connection.name
    });

    // Connection event handlers
    mongoose.connection.on('error', (error) => {
      logger.error("MongoDB connection error", { error: error.message });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn("MongoDB disconnected");
    });

    mongoose.connection.on('reconnected', () => {
      logger.info("MongoDB reconnected");
    });

  } catch (error) {
    logger.error("❌ MongoDB connection failed", { 
      error: error.message,
      uri: uri.replace(/\/\/.*:.*@/, '//***:***@') // Hide credentials in logs
    });
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    logger.info("MongoDB connection closed through app termination");
    process.exit(0);
  } catch (error) {
    logger.error("Error closing MongoDB connection", { error: error.message });
    process.exit(1);
  }
});

export default connectDB;
