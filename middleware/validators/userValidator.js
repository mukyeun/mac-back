const { body, validationResult } = require('express-validator');

// 유효성 검사 결과를 확인하는 미들웨어
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// 사용자 등록 유효성 검사 규칙
const registerValidationRules = () => [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('사용자명은 3-30자 사이여야 합니다')
    .matches(/^[A-Za-z0-9_]+$/)
    .withMessage('사용자명은 영문자, 숫자, 언더스코어만 사용할 수 있습니다'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('유효한 이메일 주소를 입력해주세요')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('비밀번호는 최소 6자 이상이어야 합니다')
    .matches(/\d/)
    .withMessage('비밀번호는 최소 1개의 숫자를 포함해야 합니다'),
  
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('이름은 2-50자 사이여야 합니다')
];

// 로그인 유효성 검사 규칙
const loginValidationRules = () => [
  body('email')
    .trim()
    .isEmail()
    .withMessage('유효한 이메일 주소를 입력해주세요')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('비밀번호를 입력해주세요')
];

module.exports = {
  validate,
  registerValidationRules,
  loginValidationRules
};