const { body, query, param } = require('express-validator');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

// 로그인 유효성 검사 규칙
const loginValidationRules = [
  body('email')
    .isEmail()
    .withMessage('유효한 이메일 주소를 입력해주세요'),
  body('password')
    .exists()
    .withMessage('비밀번호를 입력해주세요')
];

// 회원가입 유효성 검사 규칙
const registerValidationRules = [
  body('email')
    .isEmail()
    .withMessage('유효한 이메일 주소를 입력해주세요'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('비밀번호는 최소 8자 이상이어야 합니다')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]/)
    .withMessage('비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다'),
  body('name')
    .notEmpty()
    .withMessage('이름을 입력해주세요'),
  body('username')
    .notEmpty()
    .withMessage('사용자 이름을 입력해주세요')
];

// 비밀번호 변경 유효성 검사 규칙
const passwordChangeValidationRules = [
  body('currentPassword')
    .exists()
    .withMessage('현재 비밀번호를 입력해주세요'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('비밀번호는 최소 8자 이상이어야 합니다')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]/)
    .withMessage('비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다')
];

// 건강 정보 유효성 검사 규칙
const healthInfoValidationRules = () => {
  return [
    body('date').isDate().withMessage('유효한 날짜를 입력해주세요'),
    body('weight').isFloat({ min: 0 }).withMessage('유효한 체중을 입력해주세요'),
    body('height').isFloat({ min: 0 }).withMessage('유효한 신장을 입력해주세요')
  ];
};

// 페이지네이션 규칙
const paginationRules = () => {
  return [
    query('page').optional().isInt({ min: 1 }).withMessage('유효한 페이지 번호를 입력해주세요'),
    query('limit').optional().isInt({ min: 1 }).withMessage('유효한 항목 수를 입력해주세요')
  ];
};

// ID 파라미터 규칙
const idParamRules = () => {
  return [
    param('id').isMongoId().withMessage('유효한 ID가 아닙니다')
  ];
};

// 다중 삭제 규칙
const multipleDeleteRules = () => {
  return [
    body('ids').isArray().withMessage('삭제할 항목의 ID 배열이 필요합니다'),
    body('ids.*').isMongoId().withMessage('유효하지 않은 ID가 포함되어 있습니다')
  ];
};

// 프로필 업데이트 유효성 검사 규칙
const profileUpdateValidationRules = () => {
  return [
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
      .withMessage('사용자명은 영문, 숫자, 언더스코어만 사용할 수 있습니다')
  ];
};

// 유효성 검사 미들웨어
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    logger.debug('Validation passed:', {
      path: req.path,
      method: req.method
    });
    return next();
  }

  logger.warn('Validation failed:', {
    path: req.path,
    method: req.method,
    errors: errors.array()
  });

  return res.status(400).json({
    errors: errors.array()
  });
};

module.exports = {
  loginValidationRules,
  registerValidationRules,
  passwordChangeValidationRules,
  healthInfoValidationRules,
  paginationRules,
  idParamRules,
  multipleDeleteRules,
  profileUpdateValidationRules,
  validate
}; 