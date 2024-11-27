const Redis = require('ioredis');
const logger = require('../utils/logger');

// 테스트 환경을 위한 Redis Mock
class RedisMock {
  constructor() {
    this.data = new Map();
    this.timeouts = new Map();
  }

  async get(key) {
    return this.data.get(key);
  }

  async setex(key, seconds, value) {
    this.data.set(key, value);
    this.timeouts.set(key, setTimeout(() => {
      this.data.delete(key);
      this.timeouts.delete(key);
    }, seconds * 1000));
    return 'OK';
  }

  async del(key) {
    const timeout = this.timeouts.get(key);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(key);
    }
    return this.data.delete(key);
  }

  async flushall() {
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.data.clear();
    this.timeouts.clear();
    return 'OK';
  }
}

let redisClient;

if (process.env.NODE_ENV === 'test') {
  redisClient = new RedisMock();
  logger.info('Using Redis Mock for testing');
} else {
  redisClient = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    }
  });

  redisClient.on('connect', () => {
    logger.info('Redis connected');
  });

  redisClient.on('error', (err) => {
    logger.error('Redis error:', err);
  });
}

module.exports = redisClient;
