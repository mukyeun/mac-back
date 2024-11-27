require('dotenv').config();

module.exports = {
  rateLimits: {
    global: {
      windowMs: 15 * 60 * 1000, // 15분
      max: 100 // IP당 최대 요청 수
    },
    auth: {
      windowMs: 60 * 60 * 1000, // 1시간
      max: 5 // IP당 최대 인증 시도 수
    },
    api: {
      windowMs: 5 * 60 * 1000, // 5분
      max: 50 // IP당 최대 API 요청 수
    }
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      }
    }
  }
};
