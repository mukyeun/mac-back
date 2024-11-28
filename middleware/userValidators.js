const { body } = require('express-validator');

// 회원가입 유효성 검사 규칙
const registerValidationRules = () => {
  return [
    body('email')
      .isEmail()
      .withMessage('올바른 이메일 형식이 아닙니다'),
    
    body('username')
      .isLength({ min: 4, max: 20 })
      .withMessage('사용자명은 4-20자 사이여야 합니다')
      .matches(/^[A-Za-z0-9_]+$/)
      .withMessage('사용자명은 영문, 숫자, 언더스코어만 사용할 수 있습니다'),
    
    body('password')
      .isLength({ min: 8 })
      .withMessage('비밀번호는 최소 8자 이상이어야 합니다')
      .matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]/)
      .withMessage('비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다'),
    
    body('name')
      .isLength({ min: 2, max: 50 })
      .withMessage('이름은 2-50자 사이여야 합니다')
  ];
};

// 로그인 유효성 검사 규칙
const loginValidationRules = () => {
  return [
    body('email')
      .isEmail()
      .withMessage('올바른 이메일 형식이 아닙니다'),
    
    body('password')
      .notEmpty()
      .withMessage('비밀번호를 입력해주세요')
  ];
};

// 프로필 수정 유효성 검사 규칙
const profileUpdateValidationRules = () => {
  return [
    body('name')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('이름은 2-50자 사이여야 합니다'),
    
    body('username')
      .optional()
      .isLength({ min: 4, max: 20 })
      .withMessage('사용자명은 4-20자 사이여야 합니다')
      .matches(/^[A-Za-z0-9_]+$/)
      .withMessage('사용자명은 영문, 숫자, 언더스코어만 사용할 수 있습니다'),
    
    body('bio')
      .optional()
      .isLength({ max: 200 })
      .withMessage('자기소개는 200자를 초과할 수 없습니다')
  ];
};

module.exports = {
  registerValidationRules,
  loginValidationRules,
  profileUpdateValidationRules
}; 