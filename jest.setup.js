require('dotenv').config({ path: '.env.test' });
const logger = require('./utils/logger');

logger.info('Jest setup started');

// Redis mock 설정
jest.mock('redis', () => require('redis-mock'));
jest.mock('ioredis', () => require('redis-mock'));

// 전역 타임아웃 설정
jest.setTimeout(60000);

// 테스트 환경 설정
process.env.NODE_ENV = 'test';

// Mock 설정 확인
const redis = require('redis');
const client = redis.createClient();

client.on('connect', () => {
  logger.info('Redis mock connected');
});

client.on('error', (err) => {
  logger.error('Redis mock error:', err);
});

logger.info('Jest setup completed', {
  nodeEnv: process.env.NODE_ENV,
  timeout: 60000,
  redisMock: 'enabled'
});
