const User = require('../models/User');
const logger = require('../utils/logger');

const updateProfile = async (req, res) => {
  try {
    const { name, username } = req.body;
    const userId = req.user.userId;

    // 중복 사용자명 확인
    if (username) {
      const existingUser = await User.findOne({ 
        username, 
        _id: { $ne: userId } 
      });

      if (existingUser) {
        logger.warn('Duplicate username found:', { username });
        return res.status(400).json({ 
          message: '이미 사용 중인 사용자명입니다' 
        });
      }
    }

    // 프로필 업데이트
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        ...(name && { name }),
        ...(username && { username })
      },
      { new: true }
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
  updateProfile
}; 