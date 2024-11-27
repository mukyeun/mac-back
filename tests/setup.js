const mongoose = require('mongoose');
const { beforeAll, beforeEach, afterAll } = require('@jest/globals');
const logger = require('../utils/logger');

// 테스트 환경 설정
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.MONGO_URI = 'mongodb://localhost:27017/macjin_test';

beforeAll(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB:', process.env.MONGO_URI);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
});

beforeEach(async () => {
  try {
    await mongoose.connection.dropDatabase();
    console.log('Database cleared');
  } catch (error) {
    console.error('Database cleanup error:', error);
  }
});

afterAll(async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('MongoDB disconnect error:', error);
  }
});

module.exports = {
  MONGO_URI: process.env.MONGO_URI
};