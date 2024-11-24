const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/responseFormatter');
const logger = require('../utils/logger');

const auth = async (req, res, next) => {
  try {
    // JWT_SECRET 값 확인을 위한 상세 로깅
    console.log('=== JWT Authentication Debug ===');
    console.log('JWT_SECRET length:', process.env.JWT_SECRET?.length);
    console.log('JWT_SECRET first 10 chars:', process.env.JWT_SECRET?.substring(0, 10));
    console.log('JWT_SECRET type:', typeof process.env.JWT_SECRET);
    
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      logger.warn('Authorization 헤더가 없습니다');
      return res.status(401).json(errorResponse('인증 토큰이 필요합니다', 401));
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      logger.warn('잘못된 토큰 형식:', authHeader);
      return res.status(401).json(errorResponse('잘못된 토큰 형식입니다', 401));
    }

    const token = parts[1];
    
    try {
      // 토큰 디코딩 시도 (검증 전)
      const decoded = jwt.decode(token);
      console.log('Token decode attempt:', decoded);
      
      // 실제 검증
      const verified = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token verified successfully:', verified);
      
      req.userId = verified.userId;
      next();
    } catch (err) {
      console.error('Token Verification Error:', err);
      return res.status(401).json(errorResponse('유효하지 않은 토큰입니다', 401));
    }
  } catch (err) {
    console.error('Auth Middleware Error:', err);
    res.status(401).json(errorResponse('인증에 실패했습니다', 401));
  }
};

module.exports = auth;