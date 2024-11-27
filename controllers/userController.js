const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// 회원가입
const register = async ({ email, password, name, username }) => {
  logger.info('Processing registration request');

  // 이메일 중복 확인
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    logger.warn('Registration failed: Email already exists', { email });
    throw new Error('이미 등록된 이메일입니다.');
  }

  // 사용자 생성
  const user = new User({
    email,
    password,  // 모델의 pre save 미들웨어에서 해시화됨
    name,
    username
  });

  await user.save();

  logger.info('User password hashed', {
    userId: user._id,
    username: user.username
  });

  // 토큰 생성
  const token = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET || 'testsecret',
    { expiresIn: '1d' }
  );

  logger.info('Registration successful', {
    userId: user._id,
    email: user.email
  });

  return {
    token,
    user: {
      email: user.email,
      name: user.name,
      username: user.username
    }
  };
};

// 로그인
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    logger.debug('Validation passed:', {
      method: 'POST',
      path: '/login'
    });

    logger.info('Login attempt:', { email });

    const user = await User.findOne({ email });
    if (!user) {
      logger.warn('Login failed: User not found', { email });
      return res.status(401).json({ 
        message: '이메일 또는 비밀번호가 올바르지 않습니다' 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn('Login failed: Invalid password', { email });
      return res.status(401).json({ 
        message: '이메일 또는 비밀번호가 올바르지 않습니다' 
      });
    }

    const payload = {
      user: {
        userId: user._id
      }
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    logger.info('Login successful:', {
      userId: user._id,
      email: user.email
    });

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        username: user.username
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
};

// 로그아웃
const logout = async (user) => {
  try {
    logger.info('User logged out:', {
      userId: user.userId
    });
    return true;
  } catch (error) {
    logger.error('Logout error:', error);
    throw error;
  }
};

/**
 * 프로필 업데이트 컨트롤러
 */
const updateProfile = async (req, res) => {
  try {
    const { name, username } = req.body;
    const userId = req.user._id;

    // 중복 사용자명 확인
    if (username) {
      const existingUser = await User.findOne({ 
        username, 
        _id: { $ne: userId } 
      });

      if (existingUser) {
        return res.status(400).json({ 
          message: '이미 사용 중인 사용자명입니다' 
        });
      }
    }

    // 업데이트할 필드 구성
    const updateFields = {};
    if (name) updateFields.name = name;
    if (username) updateFields.username = username;

    // 프로필 업데이트
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateFields,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ 
        message: '사용자를 찾을 수 없습니다' 
      });
    }

    res.json({
      message: '프로필이 성공적으로 업데이트되었습니다',
      user: updatedUser
    });

  } catch (error) {
    logger.error('Profile update error:', error);
    res.status(500).json({ 
      message: '서버 오류가 발생했습니다' 
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  updateProfile
};
