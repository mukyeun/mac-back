const rateLimit = require('express-rate-limit');

const isTestEnvironment = process.env.NODE_ENV === 'test';

const loginLimiter = rateLimit({
  windowMs: isTestEnvironment ? 100 : 15 * 60 * 1000, // 테스트 환경: 100ms, 운영 환경: 15분
  max: 5, // 최대 5번의 요청
  message: {
    status: 'error',
    message: 'Too many login attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      message: 'Too many login attempts. Please try again later.'
    });
  }
});

// Rate Limiter 초기화 함수
loginLimiter.resetRateLimit = function() {
  if (this.store) {
    this.store.resetAll();
  }
};

module.exports = { loginLimiter };
