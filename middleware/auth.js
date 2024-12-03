const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/responseFormatter');
const logger = require('../utils/logger');

const auth = async (req, res, next) => {
  try {
    // Authorization 헤더 확인
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json(errorResponse('인증 토큰이 없습니다', 401));
    }

    // Bearer 토큰 형식 확인
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json(errorResponse('잘못된 토큰 형식입니다', 401));
    }

    const token = parts[1];
    
    // 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: decoded.userId };
    
    next();
  } catch (err) {
    logger.error('Authentication error:', err);
    res.status(401).json(errorResponse('인증에 실패했습니다', 401));
  }
};

module.exports = auth;