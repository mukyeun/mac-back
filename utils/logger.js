const winston = require('winston');

const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.printf(info => {
      const { timestamp, level, message, ...args } = info;
      const argsString = Object.keys(args).length ? JSON.stringify(args, null, 2) : '';
      return `${timestamp} [${level}]: ${message} ${argsString}`;
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// 테스트 환경에서는 로그 레벨을 warn으로 설정
if (process.env.NODE_ENV === 'test') {
  logger.level = 'warn';
}

module.exports = logger;