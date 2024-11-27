const jwt = require('jsonwebtoken');
const redisClient = require('../config/redis');
const logger = require('../utils/logger');

// 로그아웃 함수
const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      logger.warn('Logout failed: No token provided');
      return res.status(400).json({ 
        message: 'No token provided' 
      });
    }

    // 토큰 블랙리스트에 추가
    const decoded = jwt.decode(token);
    if (!decoded) {
      logger.warn('Logout failed: Invalid token format');
      return res.status(400).json({ 
        message: 'Invalid token format' 
      });
    }

    const ttl = decoded.exp - Math.floor(Date.now() / 1000);
    if (ttl > 0) {
      await redisClient.setex(`blacklist:${token}`, ttl, 'logged_out');
      logger.info('Token blacklisted successfully', { 
        userId: decoded.userId,
        ttl 
      });
    }

    res.status(200).json({ 
      message: 'Successfully logged out' 
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ 
      message: 'Logout failed', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// 단일 함수만 내보내기
module.exports = {
  logout
};