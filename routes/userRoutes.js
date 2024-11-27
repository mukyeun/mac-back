const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { updateProfile } = require('../controllers/userController');
const { validate } = require('../middleware/validate');
const { profileUpdateRules } = require('../validators/userValidators');

// 프로필 업데이트 라우트
router.put('/profile', 
  auth,  // 인증 미들웨어
  profileUpdateRules(),  // 유효성 검사 규칙
  validate,  // 유효성 검사 실행
  updateProfile  // 컨트롤러
);

module.exports = router; 