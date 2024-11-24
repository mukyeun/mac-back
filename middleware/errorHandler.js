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
    user: req.userId
  });

  // MongoDB 관련 에러 처리
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: '데이터 유효성 검증 실패',
      error: Object.values(err.errors).map(error => error.message)
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      message: '잘못된 데이터 형식',
      error: err.message
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      message: '중복된 데이터',
      error: '이미 존재하는 데이터입니다.'
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