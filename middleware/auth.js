const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      logger.warn('Authentication failed: No token provided');
      return res.status(401).json({ 
        success: false,
        message: '인증이 필요합니다' 
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    
    logger.debug('Authentication successful', { userId: decoded.userId });
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    return res.status(401).json({ 
      success: false,
      message: '유효하지 않은 토큰입니다' 
    });
  }
};

module.exports = auth;