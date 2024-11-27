const winston = require('winston');

// 로그 레벨 정의
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// 로그 포맷 정의
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.json()
);

// 로거 생성
const logger = winston.createLogger({
  levels,
  format,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// 테스트 환경에서는 로그 레벨을 debug로 설정
if (process.env.NODE_ENV === 'test') {
  logger.level = 'debug';
}

module.exports = logger;
