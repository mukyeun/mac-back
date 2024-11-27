const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      logger.debug('Already connected to test database');
      return;
    }

    const uri = process.env.MONGO_URI_TEST;
    if (!uri) {
      throw new Error('MONGO_URI_TEST is not defined in environment variables');
    }

    const conn = await mongoose.connect(uri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000
    });
    
    logger.info('Test database connected:', {
      database: conn.connection.name,
      host: conn.connection.host,
      uri: uri.split('@').pop()
    });
  } catch (error) {
    logger.error('Test database connection error:', {
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    throw error;
  }
};

const clearDB = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    const collections = mongoose.connection.collections;
    
    for (const key in collections) {
      await collections[key].deleteMany();
      logger.debug(`Cleared collection: ${key}`);
    }
    
    logger.debug('All collections cleared');
  } catch (error) {
    logger.error('Database cleanup error:', error);
    throw error;
  }
};

const closeDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      logger.debug('Database already disconnected');
      return;
    }

    await mongoose.connection.close();
    logger.info('Test database disconnected');
  } catch (error) {
    logger.error('Database disconnect error:', error);
    throw error;
  }
};

module.exports = {
  connectDB,
  clearDB,
  closeDB
};
