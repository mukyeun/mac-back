const User = require('../models/User');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs').promises;

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const updateData = {};
    const allowedFields = ['name', 'username', 'bio', 'birthDate', 'isPublic'];

    // 업데이트할 필드 필터링
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // username이 변경되는 경우 중복 체크
    if (updateData.username) {
      const existingUser = await User.findOne({ 
        username: updateData.username,
        _id: { $ne: userId }
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: '이미 사용 중인 사용자 이름입니다'
        });
      }
    }

    // 사용자 정보 업데이트
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다'
      });
    }

    // 필드 업데이트
    Object.assign(user, updateData);
    await user.save();

    // 응답에서 민감한 정보 제외
    const userResponse = {
      name: user.name,
      username: user.username,
      bio: user.bio,
      birthDate: user.birthDate,
      isPublic: user.isPublic,
      profileImage: user.profileImage
    };

    res.status(200).json({
      success: true,
      message: '프로필이 업데이트되었습니다',
      user: userResponse
    });

  } catch (error) {
    logger.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다'
    });
  }
};

const updateProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: '이미지 파일이 필요합니다' 
      });
    }

    const userId = req.user.userId;
    const imageUrl = '/uploads/' + req.file.filename;

    // findByIdAndUpdate 대신 findById와 save 사용
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: '사용자를 찾을 수 없습니다' 
      });
    }

    user.profileImage = imageUrl;
    await user.save();

    // 응답 로깅 추가
    const response = {
      success: true,
      message: '프로필 이미지가 업데이트되었습니다',
      user: {
        profileImage: user.profileImage
      }
    };
    
    console.log('Controller Response:', response);
    res.status(200).json(response);

  } catch (error) {
    console.error('Profile image update error:', error);
    logger.error('Profile image update error:', error);
    res.status(500).json({ 
      success: false,
      message: '서버 오류가 발생했습니다' 
    });
  }
};

const deleteProfileImage = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다'
      });
    }

    if (!user.profileImage) {
      return res.status(400).json({
        success: false,
        message: '삭제할 프로필 이미지가 없습니다'
      });
    }

    // 파일 시스템에서 이미지 삭제
    const imagePath = path.join(__dirname, '../../', user.profileImage);
    try {
      await fs.unlink(imagePath);
    } catch (error) {
      logger.error('File deletion error:', error);
      // 파일이 이미 없더라도 계속 진행
    }

    // DB에서 프로필 이미지 정보 삭제
    user.profileImage = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: '프로필 이미지가 삭제되었습니다',
      user: {
        profileImage: user.profileImage
      }
    });

  } catch (error) {
    logger.error('Profile image deletion error:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다'
    });
  }
};

const updatePrivacy = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { isPublic } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다'
      });
    }

    user.isPublic = isPublic;
    await user.save();

    res.status(200).json({
      success: true,
      message: '프로필 공개 설정이 업데이트되었습니다',
      user: {
        isPublic: user.isPublic
      }
    });

  } catch (error) {
    logger.error('Privacy update error:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다'
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const requestingUserId = req.user.userId;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다'
      });
    }

    // 자신의 프로필이거나 공개 프로필인 경우에만 접근 허용
    if (!user.isPublic && user._id.toString() !== requestingUserId) {
      return res.status(403).json({
        success: false,
        message: '비공개 프로필입니다'
      });
    }

    const profileData = {
      name: user.name,
      username: user.username,
      bio: user.bio,
      profileImage: user.profileImage,
      isPublic: user.isPublic
    };

    res.status(200).json({
      success: true,
      user: profileData
    });

  } catch (error) {
    logger.error('Profile retrieval error:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다'
    });
  }
};

module.exports = {
  updateProfile,
  updateProfileImage,
  deleteProfileImage,
  updatePrivacy,
  getProfile
}; 