const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const userRoutes = require('./routes/userRoutes');
const healthInfoRoutes = require('./routes/healthInfoRoutes');
const healthInfoStatsRoutes = require('./routes/healthInfoStatsRoutes');
const healthInfoImportRoutes = require('./routes/healthInfoImportRoutes');
const healthInfoExportRoutes = require('./routes/healthInfoExportRoutes');
const healthInfoChartRoutes = require('./routes/healthInfoChartRoutes');

const app = express();

// 미들웨어
app.use(cors({
  origin: 'http://localhost:3000', // 프론트엔드 주소
  credentials: true // 인증 정보 포함 허용
}));
app.use(express.json());
app.use(morgan('dev'));

// 정적 파일 제공
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API 테스트 엔드포인트
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is working!' });
});

// 라우터 등록 (순서 중요)
app.use('/api/health-info/export', healthInfoExportRoutes);
app.use('/api/health-info/stats', healthInfoStatsRoutes);
app.use('/api/health-info', healthInfoRoutes);
app.use('/api/health-info/chart', healthInfoChartRoutes);

// 라우터
app.use('/api/users', userRoutes);
app.use('/api/health-info/import', healthInfoImportRoutes);

// 에러 핸들링
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: '서버 오류가 발생했습니다'
  });
});

// MongoDB 연결
if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));
}

// 서버 시작
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;