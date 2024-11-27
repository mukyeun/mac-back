const logger = require('../../utils/logger');

// Mock 컨트롤러 함수들
const logout = jest.fn((req, res) => {
  logger.debug('Mock logout called');
  return res.status(200).json({ 
    message: 'Mock logout success' 
  });
});

// Mock 함수 리셋
beforeEach(() => {
  logout.mockClear();
});

module.exports = {
  logout
};

// 디버깅을 위한 로그
logger.info('Mock controllers loaded', {
  logoutExists: !!logout,
  isMockFunction: jest.isMockFunction(logout)
});
