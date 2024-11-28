const express = require('express');
const router = express.Router();
const { 
  getHealthInfoList, 
  getHealthInfoByDate,
  createHealthInfo,
  updateHealthInfo,
  deleteHealthInfo
} = require('../controllers/healthInfoController');
const auth = require('../middleware/auth');
const { 
  validate, 
  paginationRules,
  dateParamValidationRules 
} = require('../middleware/validators');

// 건강 정보 목록 조회
router.get('/', 
  auth,
  paginationRules(),
  validate,
  getHealthInfoList
);

// 특정 날짜의 건강 정보 조회
router.get('/:date',
  auth,
  dateParamValidationRules(),
  validate,
  getHealthInfoByDate
);

module.exports = router;