const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const { errorResponse, successResponse } = require('../utils/responseFormatter');
const { imageUpload } = require('../config/multerConfig');

// 사용자 프로필 조회
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json(errorResponse(
        '사용자를 찾을 수 없습니다',
        404
      ));
    }

    res.json(successResponse({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        username: user.username,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    }));
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json(errorResponse(
      '서버 오류가 발생했습니다',
      500
    ));
  }
});

// 프로필 수정
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, username } = req.body;
    const updates = {};
    
    if (name) updates.name = name;
    if (username) updates.username = username;
    
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json(errorResponse(
        '사용자를 찾을 수 없습니다',
        404
      ));
    }

    res.json(successResponse({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        username: user.username,
        updatedAt: user.updatedAt
      }
    }));
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json(errorResponse(
      '서버 오류가 발생했습니다',
      500
    ));
  }
});

// 비밀번호 변경
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // 현재 사용자 정보 조회 (비밀번호 포함)
    const user = await User.findById(req.user.userId).select('+password');
    if (!user) {
      return res.status(404).json(errorResponse(
        '사용자를 찾을 수 없습니다',
        404
      ));
    }

    // 현재 비밀번호 확인
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json(errorResponse(
        '현재 비밀번호가 일치하지 않습니다',
        400
      ));
    }

    // 새 비밀번호 설정
    user.password = newPassword;
    await user.save();  // 저장 시 비밀번호 해싱은 User 모델의 pre save 미들웨어에서 처리됨

    res.json(successResponse({
      message: '비밀번호가 성공적으로 변경되었습니다'
    }));
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json(errorResponse(
      '서버 오류가 발생했습니다',
      500
    ));
  }
});

// 프로필 이미지 업로드 라우트 수정
router.post('/profile/image', auth, imageUpload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json(errorResponse(
        '이미지 파일을 선택해주세요',
        400
      ));
    }

    const imageUrl = `/uploads/profiles/${req.file.filename}`;
    
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: { profileImage: imageUrl } },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json(errorResponse(
        '사용자를 찾을 수 없습니다',
        404
      ));
    }

    res.json(successResponse({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        username: user.username,
        profileImage: user.profileImage,
        updatedAt: user.updatedAt
      }
    }));
  } catch (err) {
    console.error('Profile image upload error:', err);
    res.status(500).json(errorResponse(
      '서버 오류가 발생했습니다',
      500
    ));
  }
});

module.exports = router;