const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { errorResponse } = require('../utils/responseFormatter');

const auth = (req, res, next) => {
  // 요청 로깅
  logger.http('Incoming request:', {
    method: req.method,
    url: req.url,
    params: req.params,
    query: req.query,
    body: req.body,
    ip: req.ip,
    userId: req.userId
  });

  // JWT 설정 체크
  logger.debug('JWT Configuration Check', {
    secretLength: process.env.JWT_SECRET?.length,
    secretDefined: !!process.env.JWT_SECRET,
    environment: process.env.NODE_ENV
  });

  // Authorization 헤더 체크
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    logger.warn('Missing Authorization header', {
      path: req.path,
      method: req.method,
      ip: req.ip
    });
    return res.status(401).json(errorResponse(
      '인증이 필요합니다',
      401
    ));
  }

  try {
    // Bearer 토큰 형식 체크
    if (!authHeader.startsWith('Bearer ')) {
      logger.warn('Invalid token format', {
        path: req.path,
        method: req.method,
        ip: req.ip
      });
      return res.status(401).json(errorResponse(
        '잘못된 인증 형식입니다',
        401
      ));
    }

    // 토큰 추출 및 검증
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 사용자 ID 설정
    req.userId = decoded.userId;
    
    logger.debug('Token verified successfully', {
      userId: req.userId,
      path: req.path,
      method: req.method
    });

    next();
  } catch (error) {
    logger.error('Token verification failed:', {
      error: error.message,
      path: req.path,
      method: req.method,
      ip: req.ip
    });

    // 토큰 만료 체크
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json(errorResponse(
        '인증이 만료되었습니다. 다시 로그인해주세요',
        401
      ));
    }

    // 기타 토큰 에러
    return res.status(401).json(errorResponse(
      '유효하지 않은 인증입니다',
      401
    ));
  }
};

module.exports = { auth };