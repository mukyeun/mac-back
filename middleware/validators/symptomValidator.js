const { body, validationResult } = require('express-validator');

// 유효성 검사 결과를 확인하는 미들웨어
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// 증상 생성/수정 유효성 검사 규칙
const symptomValidationRules = () => [
  body('category')
    .trim()
    .notEmpty()
    .withMessage('증상 카테고리는 필수입니다')
    .isLength({ min: 2, max: 50 })
    .withMessage('카테고리는 2-50자 사이여야 합니다'),
  
  body('description')
    .trim()
    .notEmpty()
    .withMessage('증상 설명은 필수입니다')
    .isLength({ min: 10, max: 500 })
    .withMessage('설명은 10-500자 사이여야 합니다'),
  
  body('severity')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('심각도는 1-10 사이의 숫자여야 합니다'),
  
  body('duration')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('지속시간은 100자를 초과할 수 없습니다'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('메모는 1000자를 초과할 수 없습니다'),
  
  body('date')
    .optional()
    .isISO8601()
    .withMessage('날짜 형식이 올바르지 않습니다')
    .toDate()
];

module.exports = {
  validate,
  symptomValidationRules
};