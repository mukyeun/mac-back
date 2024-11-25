const User = require('../models/User');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

// JWT 토큰 생성 함수
const generateToken = (userId) => {
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET, 
    { expiresIn: '24h' }
  );
};

// 회원가입
const register = async (req, res) => {
  try {
    const { username, email, password, name } = req.body;

    // 필수 필드 검증
    if (!email || !password || !username || !name) {
      return res.status(400).json(errorResponse(
        '모든 필드를 입력해주세요',
        400
      ));
    }

    // 이메일 중복 확인
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      logger.warn('Registration attempt with existing email', { email });
      return res.status(400).json(errorResponse(
        '이미 등록된 이메일입니다',
        400
      ));
    }

    // 사용자명 중복 확인
    const existingUsername = await User.findOne({ 
      username: username.toLowerCase() 
    });
    if (existingUsername) {
      logger.warn('Registration attempt with existing username', { username });
      return res.status(400).json(errorResponse(
        '이미 사용 중인 사용자명입니다',
        400
      ));
    }

    // 사용자 생성
    const user = await User.create({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password,
      name: name.trim()
    });

    // 토큰 생성
    const token = generateToken(user._id);

    logger.info('New user registered', {
      userId: user._id,
      username: user.username,
      email: user.email
    });

    res.status(201).json(successResponse({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role
      }
    }, '회원가입이 완료되었습니다'));
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json(errorResponse(
      '회원가입 처리 중 오류가 발생했습니다',
      500,
      process.env.NODE_ENV === 'development' ? error.message : undefined
    ));
  }
};

// 로그인
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 이메일과 비밀번호 확인
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '이메일과 비밀번호를 입력해주세요'
      });
    }

    // 사용자 조회 (비밀번호 필드 포함)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '등록되지 않은 사용자입니다'
      });
    }

    // 비밀번호 확인
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: '비밀번호가 일치하지 않습니다'
      });
    }

    // 마지막 로그인 시간 업데이트
    await user.updateLastLogin();

    // 토큰 생성
    const token = generateToken(user._id);

    logger.info('User logged in', {
      userId: user._id,
      username: user.username
    });

    res.json({
      success: true,
      message: '로그인이 완료되었습니다',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: '로그인 처리 중 오류가 발생했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 현재 사용자 정보 조회
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    });
  } catch (error) {
    logger.error('Get user info error:', error);
    res.status(500).json({
      success: false,
      message: '사용자 정보 조회 중 오류가 발생했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  register,
  login,
  getMe
};