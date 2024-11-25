const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { errorResponse, successResponse } = require('../utils/responseFormatter');
const { auth } = require('../middleware/auth');
const logger = require('../utils/logger');

// 입력값 검증 함수들
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

const validateRequired = (value) => {
  return value && value.trim().length > 0;
};

// 회원가입
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, username } = req.body;
    
    // 입력값 검증
    if (!validateEmail(email)) {
      return res.status(400).json(errorResponse(
        '유효한 이메일 주소를 입력해주세요',
        400
      ));
    }

    if (!validatePassword(password)) {
      return res.status(400).json(errorResponse(
        '비밀번호는 최소 6자 이상이어야 합니다',
        400
      ));
    }

    if (!validateRequired(name)) {
      return res.status(400).json(errorResponse(
        '이름을 입력해주세요',
        400
      ));
    }

    if (!validateRequired(username)) {
      return res.status(400).json(errorResponse(
        '사용자명을 입력해주세요',
        400
      ));
    }
    
    // 이메일 중복 확인
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.warn('Registration attempt with existing email', { email });
      return res.status(400).json(errorResponse(
        '이미 사용 중인 이메일입니다',
        400
      ));
    }

    // 새 사용자 생성
    const user = new User({
      email,
      password,
      name,
      username
    });
    await user.save();

    // 토큰 생성
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    logger.info('New user registered', {
      userId: user._id,
      email: user.email
    });

    res.status(201).json(successResponse({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        username: user.username
      }
    }));
  } catch (err) {
    logger.error('Registration error:', err);
    res.status(500).json(errorResponse(
      '서버 오류가 발생했습니다',
      500
    ));
  }
});

// 로그인
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      logger.warn('Login attempt with non-existent email', { email });
      return res.status(401).json(errorResponse(
        '이메일 또는 비밀번호가 잘못되었습니다',
        401
      ));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      logger.warn('Login attempt with incorrect password', { email });
      return res.status(401).json(errorResponse(
        '이메일 또는 비밀번호가 잘못되었습니다',
        401
      ));
    }

    // 마지막 로그인 시간 업데이트
    await user.updateLastLogin();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    logger.info('User logged in', {
      userId: user._id,
      email: user.email
    });

    res.json(successResponse({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    }));
  } catch (err) {
    logger.error('Login error:', err);
    res.status(500).json(errorResponse(
      '서버 오류가 발생했습니다',
      500
    ));
  }
});

module.exports = router;