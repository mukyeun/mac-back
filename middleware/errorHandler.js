const logger = require('../utils/logger');

class AppError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  logger.error('Error occurred:', {
    name: err.name,
    message: err.message,
    status: err.status,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // MongoDB 중복 키 에러 처리
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const message = field === 'username' 
      ? '이미 사용 중인 사용자명입니다'
      : field === 'email'
      ? '이미 사용 중인 이메일입니다'
      : '중복된 값이 존재합니다';
    
    return res.status(400).json({ 
      status: 'error',
      message 
    });
  }

  // Validation 에러 처리
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      status: 'error',
      message: '입력값이 유효하지 않습니다',
      errors: Object.values(err.errors).map(error => ({
        field: error.path,
        message: error.message
      }))
    });
  }

  // JWT 에러 처리
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'error',
      message: '유효하지 않은 토큰입니다'
    });
  }

  // 기본 에러 응답
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || '서버 오류가 발생했습니다',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = {
  AppError,
  errorHandler
};