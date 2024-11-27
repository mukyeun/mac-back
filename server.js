const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/users');
const healthInfoRoutes = require('./routes/healthInfo');
const logger = require('./utils/logger');

const app = express();

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 개발 환경에서만 morgan 사용
if (process.env.NODE_ENV === 'development') {
  const morgan = require('morgan');
  app.use(morgan('dev'));
}

// 라우트
app.use('/api/users', userRoutes);
app.use('/api/health-info', healthInfoRoutes);

// 에러 핸들링
app.use((err, req, res, next) => {
  logger.error('Server error:', {
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
  
  res.status(500).json({ 
    message: '서버 오류가 발생했습니다' 
  });
});

module.exports = app;