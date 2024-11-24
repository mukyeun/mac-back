const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { errorResponse, successResponse } = require('../utils/responseFormatter');

// 회원가입
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, username } = req.body;
    
    // 이메일 중복 확인
    const existingUser = await User.findOne({ email });
    if (existingUser) {
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

    res.status(201).json(successResponse({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    }));
  } catch (err) {
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
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json(errorResponse(
        '이메일 또는 비밀번호가 잘못되었습니다',
        401
      ));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json(errorResponse(
        '이메일 또는 비밀번호가 잘못되었습니다',
        401
      ));
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json(successResponse({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    }));
  } catch (err) {
    res.status(500).json(errorResponse(
      '서버 오류가 발생했습니다',
      500
    ));
  }
});

module.exports = router;