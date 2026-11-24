const mongoose = require('mongoose');
const logger = require('../utils/logger');
const { isDemoModeDb, isDemoMode } = require('./kite.config');

const connectDB = async () => {
  if (isDemoModeDb() || isDemoMode()) {
    logger.info('📦 Running in DEMO MODE - Using in-memory storage (MongoDB not required)');
    return;
  }

  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kite-algo-trading';

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // fail fast — don't hang for 30s
    });

    logger.info(`MongoDB connected: ${mongoose.connection.host}`);

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

  } catch (error) {
    logger.error('MongoDB connection failed:', error.message);
    logger.warn('⚠️  Continuing without MongoDB. Set DEMO_MODE=true in .env to suppress this.');
    // Don't process.exit — allow the server to run in degraded/demo mode
  }
};

module.exports = connectDB;
