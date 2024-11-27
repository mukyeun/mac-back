const logger = require('../../utils/logger');

// 테스트용 mock auth 미들웨어
const auth = (req, res, next) => {
  // 테스트용 사용자 정보 설정
  req.user = { 
    id: 'test-user-id', 
    email: 'test@example.com' 
  };
  
  // userId도 설정 (기존 코드와의 호환성을 위해)
  req.userId = req.user.id;

  logger.debug('Mock auth applied', { userId: req.user.id });
  next();
};

module.exports = { auth };

// 디버깅을 위한 로그
logger.info('Mock auth middleware loaded', {
  type: typeof auth,
  exists: !!auth
});
