const { query, body, param, validationResult } = require('express-validator');

// 공통 검증 미들웨어
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: errors.array()[0].msg
        });
    }
    next();
};

// 회이지네이션 검증 규칙
const paginationRules = () => [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('페이지 번호는 1 이상이어야 합니다'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('페이지당 항목 수는 1-100 사이여야 합니다')
];

// 회원가입 검증 규칙
const registerValidationRules = () => [
    body('email').isEmail().withMessage('유효한 이메일을 입력하세요'),
    body('username').isLength({ min: 3 }).withMessage('사용자명은 3자 이상이어야 합니다'),
    body('password').isLength({ min: 6 }).withMessage('비밀번호는 6자 이상이어야 합니다'),
    body('name').notEmpty().withMessage('이름을 입력하세요')
];

// 로그인 검증 규칙
const loginValidationRules = () => [
    body('email').isEmail().withMessage('유효한 이메일을 입력하세요'),
    body('password').notEmpty().withMessage('비밀번호를 입력하세요')
];

// 프로필 수정 검증 규칙
const profileUpdateValidationRules = () => [
    body('username').optional().isLength({ min: 3 }).withMessage('사용자명은 3자 이상이어야 합니다'),
    body('name').optional().notEmpty().withMessage('이름을 입력하세요')
];

// 날짜 범위 검증 규칙
const validateDateRange = () => [
    query('startDate')
        .optional()
        .isDate()
        .withMessage('유효하지 않은 날짜 범위'),
    query('endDate')
        .optional()
        .isDate()
        .withMessage('유효하지 않은 날짜 범위')
        .custom((endDate, { req }) => {
            if (req.query.startDate && endDate) {
                if (new Date(endDate) < new Date(req.query.startDate)) {
                    throw new Error('종료 날짜는 시작 날짜보다 늦어야 합니다');
                }
            }
            return true;
        })
];

// 날짜 파라미터 검증 규칙
const dateParamValidationRules = () => [
    param('date')
        .isDate()
        .withMessage('올바른 날짜 형식이 아닙니다')
];

// 내보내기 검증 규칙
const exportValidationRules = () => [
    query('format')
        .optional()
        .isIn(['csv', 'json'])
        .withMessage('지원하지 않는 형식입니다'),
    query('startDate')
        .optional()
        .isDate()
        .withMessage('시작 날짜가 올바르지 않습니다'),
    query('endDate')
        .optional()
        .isDate()
        .withMessage('종료 날짜가 올바르지 않습니다')
        .custom((endDate, { req }) => {
            if (req.query.startDate && endDate) {
                if (new Date(endDate) < new Date(req.query.startDate)) {
                    throw new Error('종료 날짜는 시작 날짜보다 늦어야 합니다');
                }
            }
            return true;
        })
];

// 지표 유형 검증 규칙
const validateMetricType = () => [
    param('metric')
        .isIn(['weight', 'blood-pressure', 'steps'])
        .withMessage('지원하지 않는 지표입니다')
];

module.exports = {
    validate,
    paginationRules,
    registerValidationRules,
    loginValidationRules,
    profileUpdateValidationRules,
    validateDateRange,
    dateParamValidationRules,
    exportValidationRules,
    validateMetricType
}; 