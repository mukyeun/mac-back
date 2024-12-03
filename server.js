const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const logger = require('./utils/logger');
require('dotenv').config();

const userRoutes = require('./routes/userRoutes');
const healthInfoRoutes = require('./routes/healthInfoRoutes');
const healthInfoStatsRoutes = require('./routes/healthInfoStatsRoutes');
const healthInfoImportRoutes = require('./routes/healthInfoImportRoutes');
const healthInfoExportRoutes = require('./routes/healthInfoExportRoutes');
const healthInfoChartRoutes = require('./routes/healthInfoChartRoutes');
const authRoutes = require('./routes/auth');

const app = express();

// 미들웨어
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// body-parser 설정을 먼저 적용
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 요청 로깅 미들웨어
app.use((req, res, next) => {
  if (req.method === 'POST') {
    logger.info('Request Details:', {
      url: req.url,
      headers: req.headers,
      body: req.body
    });
  }
  next();
});

app.use(morgan('dev'));

// 정적 파일 제공
app.use('/uploads', express.static('uploads'));

// API 테스트 엔드포인트
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is working!' });
});

// 라우터 등록
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/health-info', healthInfoRoutes);
app.use('/api/health-info-stats', healthInfoStatsRoutes);
app.use('/api/health-info-import', healthInfoImportRoutes);
app.use('/api/health-info-export', healthInfoExportRoutes);
app.use('/api/health-info-chart', healthInfoChartRoutes);

// 에러 핸들링
app.use((err, req, res, next) => {
  logger.error('Server Error:', err);
  res.status(500).json({
    success: false,
    message: '서버 오류가 발생했습니다'
  });
});

// MongoDB 연결
if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => logger.info('Connected to MongoDB'))
    .catch(err => logger.error('MongoDB connection error:', err));
}

// 서버 시작
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

module.exports = app;