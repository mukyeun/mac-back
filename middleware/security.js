const helmet = require('helmet');
const logger = require('../utils/logger');
const xss = require('xss');
const rateLimit = require('express-rate-limit');

// Rate limiting 설정
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 5, // 최대 5회 시도
  handler: function (req, res) {
    res.status(429).json({
      status: 'error',
      statusCode: 429,
      message: '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.'
    });
  }
});

const setupSecurity = (app) => {
  // 기본 보안 헤더 설정
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        scriptSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"]
      }
    },
    xssFilter: false // 기본 helmet XSS 필터 비활성화
  }));

  // X-Frame-Options 설정
  app.use(helmet.frameguard({ action: 'DENY' }));

  // 사용자 정의 XSS 보호 설정
  app.use((req, res, next) => {
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // Content Type 스니핑 방지
  app.use(helmet.noSniff());

  // CORS 프리플라이트 요청 처리
  app.use((req, res, next) => {
    // CORS 헤더 설정
    const origin = req.headers.origin;
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://example.com', // 테스트를 위해 추가
      process.env.FRONTEND_URL
    ].filter(Boolean);

    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    // 프리플라이트 요청 처리
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    next();
  });

  // SQL Injection 방지
  app.use((req, res, next) => {
    const sqlPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION)\b)/gi;
    const body = JSON.stringify(req.body);
    
    if (sqlPattern.test(body)) {
      logger.warn('SQL Injection 시도 감지:', {
        ip: req.ip,
        body: req.body
      });
      return res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: '유효하지 않은 입력입니다.'
      });
    }
    next();
  });

  // NoSQL Injection 방지
  app.use((req, res, next) => {
    const hasOperator = (obj) => {
      for (let key in obj) {
        if (key.startsWith('$')) return true;
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          if (hasOperator(obj[key])) return true;
        }
      }
      return false;
    };

    if (req.body && hasOperator(req.body)) {
      logger.warn('NoSQL Injection 시도 감지:', {
        ip: req.ip,
        body: req.body
      });
      return res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: '유효하지 않은 입력입니다.'
      });
    }
    next();
  });

  // 보안 설정 로깅
  logger.info('Security middleware configured', {
    headers: {
      xframe: 'DENY',
      xssProtection: true,
      noSniff: true
    },
    cors: {
      enabled: true,
      credentials: true
    }
  });
};

const sanitizeData = (req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key]);
      }
    });
  }
  next();
};

module.exports = { 
  setupSecurity, 
  sanitizeData,
  loginLimiter 
};