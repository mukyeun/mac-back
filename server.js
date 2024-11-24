const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Import routes
const userRoutes = require('./routes/users');
const healthInfoRoutes = require('./routes/healthInfo');
const symptomRoutes = require('./routes/symptoms');

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',  // React 앱의 주소
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// MongoDB connection (only if not in test mode)
if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => logger.info('MongoDB connected successfully'))
    .catch((err) => logger.error('MongoDB connection error:', err));
}

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  swaggerOptions: {
    persistAuthorization: true,
  },
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Health Info API Documentation"
}));

// Rate limiter 설정
const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW * 60 * 1000, // 15분
  max: process.env.RATE_LIMIT, // 100 요청
  message: {
    error: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.'
  }
});

// 미들웨어에 rate limiter 추가
app.use(limiter);

// Routes
app.use('/api/users', userRoutes);
app.use('/api/health-info', healthInfoRoutes);
app.use('/api/symptoms', symptomRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to Health Info API',
    documentation: '/api-docs'
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
    logger.info(`API Documentation available at http://localhost:${PORT}/api-docs`);
  });
}

module.exports = app;  // Export app for testing