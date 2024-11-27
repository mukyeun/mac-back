const { body } = require('express-validator');

/**
 * 프로필 업데이트 유효성 검사 규칙
 */
const profileUpdateValidationRules = () => [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('이름은 2-50자 사이여야 합니다'),
  
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('사용자명은 3-30자 사이여야 합니다')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('사용자명은 영문, 숫자, 언더스코어만 사용할 수 있습니다'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('유효한 이메일 주소를 입력해주세요')
    .normalizeEmail()
];

/**
 * 비밀번호 변경 유효성 검사 규칙
 */
const passwordChangeValidationRules = () => [
  body('currentPassword')
    .exists()
    .withMessage('현재 비밀번호를 입력해주세요'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('새 비밀번호는 최소 8자 이상이어야 합니다')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]/)
    .withMessage('비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다')
];

module.exports = {
  profileUpdateValidationRules,
  passwordChangeValidationRules
}; 