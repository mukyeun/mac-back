const logger = require('../utils/logger');

// 에러 처리 미들웨어
const errorHandler = (err, req, res, next) => {
  // 에러 로깅
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
    user: req.userId,
    timestamp: new Date().toISOString()
  });

  // MongoDB 관련 에러 처리
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: '데이터 유효성 검증 실패',
      error: Object.values(err.errors).map(error => error.message)
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: '잘못된 데이터 형식',
      error: err.message
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: '중복된 데이터',
      error: '이미 존재하는 데이터입니다.'
    });
  }

  // JWT 인증 에러 처리
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: '유효하지 않은 토큰',
      error: '인증에 실패했습니다.'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: '만료된 토큰',
      error: '토큰이 만료되었습니다.'
    });
  }

  // 권한 관련 에러
  if (err.name === 'UnauthorizedError') {
    return res.status(403).json({
      success: false,
      message: '접근 권한 없음',
      error: '해당 리소스에 대한 접근 권한이 없습니다.'
    });
  }

  // 기본 에러 응답
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? '서버 에러가 발생했습니다.' 
    : err.message;

  res.status(status).json({
    message,
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
};

module.exports = errorHandler;