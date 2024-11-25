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

// JWT 설정 확인
if (!process.env.JWT_SECRET) {
  logger.error('JWT_SECRET is not defined in environment variables');
  process.exit(1);
}

// 로깅 미들웨어 적용
app.use((req, res, next) => {
  logger.http('Incoming request:', {
    method: req.method,
    url: req.url,
    params: req.params,
    query: req.query,
    body: req.body,
    ip: req.ip,
    headers: {
      authorization: req.headers.authorization ? 'present' : 'missing',
      contentType: req.headers['content-type']
    }
  });
  next();
});

// CORS 설정
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked request from:', { origin });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Accept',
    'Content-Disposition',
    'Origin',
    'X-Requested-With'
  ],
  exposedHeaders: [
    'Content-Disposition',
    'Content-Type'
  ],
  maxAge: 86400
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/health-info-db';

if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(MONGODB_URI)
    .then(() => logger.info('MongoDB connected successfully'))
    .catch((err) => {
      logger.error('MongoDB connection error:', {
        error: err.message,
        stack: err.stack
      });
      process.exit(1);
    });
}

// MongoDB 이벤트 리스너
mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error:', {
    error: err.message,
    stack: err.stack
  });
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected. Attempting to reconnect...');
});

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  swaggerOptions: {
    persistAuthorization: true,
  },
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Health Info API Documentation"
}));

// Rate limiter
const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW * 60 * 1000 || 15 * 60 * 1000,
  max: process.env.RATE_LIMIT || 100,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded:', {
      ip: req.ip,
      path: req.path
    });
    res.status(429).json({
      success: false,
      message: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
      error: {
        statusCode: 429,
        remainingTime: Math.ceil(req.rateLimit.resetTime / 1000)
      }
    });
  }
});

// 파일 다운로드 제외 rate limit 적용
app.use((req, res, next) => {
  if (req.path.endsWith('/export')) {
    logger.info('Export request detected - bypassing rate limit');
    next();
  } else {
    limiter(req, res, next);
  }
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/health-info', healthInfoRoutes);
app.use('/api/symptoms', symptomRoutes);

// Base route
app.get('/', (req, res) => {
  logger.info('Base route accessed');
  res.json({ 
    success: true,
    message: 'Welcome to Health Info API',
    documentation: '/api-docs',
    version: process.env.API_VERSION || '1.0.0'
  });
});

// 404 handler
app.use((req, res) => {
  logger.warn('404 Not Found:', {
    method: req.method,
    path: req.path,
    ip: req.ip
  });
  res.status(404).json({
    success: false,
    message: '요청한 리소스를 찾을 수 없습니다',
    error: {
      statusCode: 404
    }
  });
});

// Error handlers
app.use(errorHandler);

// Excel export error handler
app.use((err, req, res, next) => {
  if (err && req.path.endsWith('/export')) {
    logger.error('Excel export error:', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      userId: req.userId
    });
    res.status(500).json({
      success: false,
      message: '엑셀 파일 생성 중 오류가 발생했습니다.',
      error: {
        statusCode: 500,
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      }
    });
  } else {
    next(err);
  }
});

// Server start
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000;
  const server = app.listen(PORT, () => {
    logger.info(`Server started successfully`, {
      port: PORT,
      env: process.env.NODE_ENV,
      time: new Date().toISOString()
    });
    logger.info(`API Documentation available at http://localhost:${PORT}/api-docs`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Starting graceful shutdown...');
    server.close(() => {
      logger.info('Server closed. Process terminating...');
      mongoose.connection.close(false, () => {
        logger.info('MongoDB connection closed.');
        process.exit(0);
      });
    });
  });
}

// Global error handlers
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', {
    error: err.message,
    stack: err.stack
  });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', {
    error: err.message,
    stack: err.stack
  });
  process.exit(1);
});

module.exports = app;