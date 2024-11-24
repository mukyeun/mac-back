const { body, validationResult } = require('express-validator');

// 유효성 검사 결과를 확인하는 미들웨어
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// 건강정보 생성/수정 유효성 검사 규칙
const healthInfoValidationRules = () => [
  body('weight')
    .optional()
    .isFloat({ min: 0, max: 500 })
    .withMessage('체중은 0-500kg 사이의 값이어야 합니다'),
  
  body('height')
    .optional()
    .isFloat({ min: 0, max: 300 })
    .withMessage('신장은 0-300cm 사이의 값이어야 합니다'),
  
  body('bloodPressure.systolic')
    .optional()
    .isInt({ min: 0, max: 300 })
    .withMessage('수축기 혈압은 0-300mmHg 사이의 값이어야 합니다'),
  
  body('bloodPressure.diastolic')
    .optional()
    .isInt({ min: 0, max: 200 })
    .withMessage('이완기 혈압은 0-200mmHg 사이의 값이어야 합니다'),
  
  body('bloodSugar')
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .withMessage('혈당은 0-1000mg/dL 사이의 값이어야 합니다'),
  
  body('temperature')
    .optional()
    .isFloat({ min: 30, max: 45 })
    .withMessage('체온은 30-45°C 사이의 값이어야 합니다'),
  
  body('date')
    .optional()
    .isISO8601()
    .withMessage('날짜 형식이 올바르지 않습니다')
    .toDate(),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('메모는 1000자를 초과할 수 없습니다')
];

module.exports = {
  validate,
  healthInfoValidationRules
};