const winston = require('winston');
const path = require('path');
const DailyRotateFile = require('winston-daily-rotate-file');

// 커스텀 로그 레벨 정의
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// 로그 레벨별 색상 정의
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

winston.addColors(colors);

// 로그 포맷 정의
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level.toUpperCase()}]: ${message} ${metaStr}`;
  })
);

// 로그 파일 옵션
const fileOptions = {
  maxSize: '5m',
  maxFiles: '14d',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  dirname: path.join(process.cwd(), 'logs')
};

// 로거 생성
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  levels,
  format: logFormat,
  transports: [
    // 에러 로그
    new DailyRotateFile({
      ...fileOptions,
      filename: 'error-%DATE%.log',
      level: 'error',
    }),
    // HTTP 요청 로그
    new DailyRotateFile({
      ...fileOptions,
      filename: 'http-%DATE%.log',
      level: 'http',
    }),
    // 전체 로그
    new DailyRotateFile({
      ...fileOptions,
      filename: 'combined-%DATE%.log',
    })
  ]
});

// 개발 환경에서는 콘솔에도 출력
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
        return `${timestamp} [${level}]: ${message} ${metaStr}`;
      })
    )
  }));
}

// 로그 유틸리티 함수
logger.logRequest = (req, res, next) => {
  logger.http({
    method: req.method,
    url: req.url,
    params: req.params,
    query: req.query,
    body: req.body,
    ip: req.ip,
    userId: req.userId
  });
  next();
};

logger.logError = (error, req) => {
  logger.error({
    message: error.message,
    stack: error.stack,
    path: req?.path,
    method: req?.method,
    body: req?.body,
    query: req?.query,
    params: req?.params,
    userId: req?.userId,
    timestamp: new Date().toISOString()
  });
};

// 프로세스 예외 처리
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection:', error);
  process.exit(1);
});

module.exports = logger;