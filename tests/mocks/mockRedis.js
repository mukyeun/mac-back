const logger = require('../../utils/logger');

class RedisMock {
  constructor() {
    this.data = new Map();
    this.timeouts = new Map();
    logger.info('Redis mock initialized');
  }

  async connect() {
    logger.info('Redis mock connected');
    return this;
  }

  async get(key) {
    const value = this.data.get(key);
    logger.debug('Redis mock GET:', { key, value });
    return value;
  }

  async setex(key, seconds, value) {
    this.data.set(key, value);
    const timeout = setTimeout(() => {
      this.data.delete(key);
      this.timeouts.delete(key);
      logger.debug('Redis mock key expired:', { key });
    }, seconds * 1000);
    this.timeouts.set(key, timeout);
    logger.debug('Redis mock SETEX:', { key, seconds, value });
    return 'OK';
  }

  async del(key) {
    const timeout = this.timeouts.get(key);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(key);
    }
    const result = this.data.delete(key);
    logger.debug('Redis mock DEL:', { key, success: result });
    return result ? 1 : 0;
  }

  async quit() {
    this.timeouts.forEach(clearTimeout);
    this.data.clear();
    this.timeouts.clear();
    logger.info('Redis mock disconnected');
  }
}

module.exports = RedisMock;

logger.info('Redis mock module loaded'); 