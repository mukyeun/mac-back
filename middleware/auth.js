const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const auth = (req, res, next) => {
  try {
    // 헤더에서 토큰 추출
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      logger.warn('Authentication failed: No token provided');
      return res.status(401).json({ message: '인증이 필요합니다' });
    }

    const token = authHeader.split(' ')[1];  // "Bearer TOKEN" 형식에서 토큰 추출
    if (!token) {
      logger.warn('Authentication failed: No token provided');
      return res.status(401).json({ message: '인증이 필요합니다' });
    }

    // 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;  // 검증된 사용자 정보를 요청 객체에 추가

    logger.debug('Authentication successful', {
      userId: decoded.userId
    });

    next();
  } catch (error) {
    logger.error('Authentication failed:', error);
    res.status(401).json({ message: '유효하지 않은 토큰입니다' });
  }
};

module.exports = auth;