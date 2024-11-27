const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');
const securityConfig = require('../config/security');

const createRateLimiter = (options) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      status: 'error',
      message: options.message || '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.'
    },
    handler: (req, res, next, options) => {
      logger.warn(`Rate limit exceeded - IP: ${req.ip}, Path: ${req.path}`);
      res.status(429).json(options.message);
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // 개발 환경에서는 rate limit 건너뛰기
      return process.env.NODE_ENV === 'development';
    }
  });
};

const limiters = {
  global: createRateLimiter({
    ...securityConfig.rateLimits.global,
    message: '전체 API 요청 제한을 초과했습니다.'
  }),
  
  auth: createRateLimiter({
    ...securityConfig.rateLimits.auth,
    message: '인증 시도가 너무 많습니다. 1시간 후 다시 시도해주세요.'
  }),
  
  api: createRateLimiter({
    ...securityConfig.rateLimits.api,
    message: 'API 요청 제한을 초과했습니다.'
  })
};

module.exports = limiters;
