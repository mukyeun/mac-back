const express = require('express');
const router = express.Router();

// 컨트롤러 함수들 import
const {
    registerUser,
    loginUser,
    getProfile,
    updateProfile,
} = require('../controllers/userController');

// 미들웨어 import
const auth = require('../middleware/auth');
const { 
    registerValidationRules, 
    loginValidationRules,
    profileUpdateValidationRules
} = require('../middleware/userValidators');
const { validate } = require('../middleware/validators');

// 회원가입
router.post('/register', 
    registerValidationRules(), 
    validate, 
    registerUser
);

// 로그인
router.post('/login', 
    loginValidationRules(), 
    validate, 
    loginUser
);

// 프로필 조회 (인증 필요)
router.get('/profile', 
    auth, 
    getProfile
);

// 프로필 수정 (인증 필요)
router.put('/profile',
    auth,
    profileUpdateValidationRules(),
    validate,
    updateProfile
);

module.exports = router; 