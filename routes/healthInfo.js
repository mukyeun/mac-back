const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const logger = require('../config/logger');
const HealthInfo = require('../models/HealthInfo');
const { 
  healthInfoValidationRules, 
  paginationRules,
  idParamRules,
  multipleDeleteRules,
  validate 
} = require('../middleware/validators');

// 미들웨어 로드 확인
logger.info('Health Info Router loaded', {
  authType: typeof auth,
  healthInfo: true,
  validators: {
    validate: !!validate,
    healthInfoValidationRules: !!healthInfoValidationRules,
    paginationRules: !!paginationRules,
    idParamRules: !!idParamRules,
    multipleDeleteRules: !!multipleDeleteRules
  }
});

// 엑셀 내보내기
router.get('/export', auth, async (req, res) => {
  try {
    const healthInfos = await HealthInfo.find({ userId: req.userId })
      .lean()
      .sort({ createdAt: -1 });

    if (!healthInfos?.length) {
      return res.status(404).json(errorResponse(
        '내보낼 데이터가 없습니다',
        404
      ));
    }

    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet('건강 정보');

    // 엑셀 컬럼 정의
    worksheet.columns = [
      { header: '날짜', key: 'createdAt', width: 15 },
      { header: '이름', key: '기본정보.이름', width: 10 },
      { header: '연락처', key: '기본정보.연락처', width: 15 },
      { header: '성별', key: '기본정보.성별', width: 8 },
      { header: '신장', key: '기본정보.신장', width: 8 },
      { header: '체중', key: '기본정보.체중', width: 8 },
      { header: '성격', key: '기본정보.성격', width: 10 },
      { header: '스트레스', key: '기본정보.스트레스', width: 10 },
      { header: '노동강도', key: '기본정보.노동강도', width: 10 },
      { header: '수축기혈압', key: '맥파분석.수축기혈압', width: 12 },
      { header: '이완기혈압', key: '맥파분석.이완기혈압', width: 12 },
      { header: '맥박수', key: '맥파분석.맥박수', width: 10 },
      { header: '증상', key: '증상선택.증상', width: 30 },
      { header: '약물', key: '복용약물.약물', width: 30 },
      { header: '기호식품', key: '복용약물.기호식품', width: 30 },
      { header: '메모', key: 'memo', width: 30 }
    ];

    // 데이터 추가
    healthInfos.forEach(info => {
      worksheet.addRow({
        createdAt: info.createdAt ? new Date(info.createdAt).toLocaleDateString('ko-KR') : '',
        '기본정보.이름': info.기본정보?.이름 || '',
        '기본정보.연락처': info.기본정보?.연락처 || '',
        '기본정보.성별': info.기본정보?.성별 || '',
        '기본정보.신장': info.기본정보?.신장 || '',
        '기본정보.체중': info.기본정보?.체중 || '',
        '기본정보.성격': info.기본정보?.성격 || '',
        '기본정보.스트레스': info.기본정보?.스트레스 || '',
        '기본정보.노동강도': info.기본정보?.노동강도 || '',
        '맥파분석.수축기혈압': info.맥파분석?.수축기혈압 || '',
        '맥파분석.이완기혈압': info.맥파분석?.이완기혈압 || '',
        '맥파분석.맥박수': info.맥파분석?.맥박수 || '',
        '증상선택.증상': Array.isArray(info.증상선택?.증상) ? info.증상선택.증상.join(', ') : '',
        '복용약물.약물': Array.isArray(info.복용약물?.약물) ? info.복용약물.약물.join(', ') : '',
        '복용약물.기호식품': Array.isArray(info.복용약물?.기호식품) ? info.복용약물.기호식품.join(', ') : '',
        'memo': info.메모 || ''
      });
    });

    // 스타일 적용
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // 파일 다운로드 설정
    res.setHeader(
      'Content-Type', 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition', 
      `attachment; filename=건강정보_${new Date().toISOString().slice(0,10)}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    logger.error('Export error:', error);
    if (!res.headersSent) {
      res.status(500).json(errorResponse(
        '엑셀 파일 생성에 실패했습니다',
        500
      ));
    }
  }
});

// 여러 건강정보 삭제
router.post('/multiple-delete',
  auth,
  multipleDeleteRules(),
  validate,
  async (req, res) => {
    try {
      const { ids } = req.body;
      
      // userId 체크 추가
      const result = await HealthInfo.deleteMany({
        _id: { $in: ids },
        userId: req.userId
      });

      if (result.deletedCount === 0) {
        return res.status(404).json(errorResponse(
          '삭제할 데이터를 찾을 수 없습니다',
          404
        ));
      }

      logger.info('Multiple health info deleted', {
        count: result.deletedCount,
        userId: req.userId
      });

      res.json(successResponse(
        { deletedCount: result.deletedCount },
        `${result.deletedCount}개의 건강정보가 삭제되었습니다`
      ));
    } catch (error) {
      logger.error('Multiple delete error:', error);
      res.status(500).json(errorResponse(
        '삭제 처리 중 오류가 발생했습니다',
        500
      ));
    }
  }
);

// 목록 조회
router.get('/', 
  auth,
  paginationRules(),
  validate,
  async (req, res) => {
    try {
      const { 
        searchTerm,
        startDate,
        endDate,
        page = 1,
        limit = 10
      } = req.query;

      let query = { userId: req.userId };

      // 검색어 처리
      if (searchTerm) {
        query.$or = [
          { '기본정보.이름': { $regex: searchTerm, $options: 'i' } },
          { '기본정보.연락처': { $regex: searchTerm, $options: 'i' } }
        ];
      }

      // 날짜 범위 처리
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const skip = (page - 1) * limit;
      const [healthInfos, total] = await Promise.all([
        HealthInfo.find(query)
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 }),
        HealthInfo.countDocuments(query)
      ]);

      res.json(successResponse({
        healthInfos,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }));
    } catch (error) {
      logger.error('List error:', error);
      res.status(500).json(errorResponse(
        '건강정보 목록 조회 중 오류가 발생했습니다',
        500
      ));
    }
  }
);

// 건강정보 생성
router.post('/',
  auth,
  healthInfoValidationRules(),
  validate,
  async (req, res) => {
    try {
      const healthInfo = new HealthInfo({
        ...req.body,
        userId: req.userId
      });
      
      const savedInfo = await healthInfo.save();
      
      logger.info('Health info created', {
        id: savedInfo._id,
        userId: req.userId,
        name: savedInfo.기본정보?.이름
      });

      res.status(201).json(successResponse(
        { healthInfo: savedInfo },
        '건강정보가 저장되었습니다'
      ));
    } catch (error) {
      logger.error('Create health info error:', error);
      res.status(500).json(errorResponse(
        '건강정보 저장 중 오류가 발생했습니다',
        500
      ));
    }
  }
);

// 건강정보 상세 조회
router.get('/:id',
  auth,
  idParamRules(),
  validate,
  async (req, res) => {
    try {
      const healthInfo = await HealthInfo.findOne({
        _id: req.params.id,
        userId: req.userId
      });

      if (!healthInfo) {
        return res.status(404).json(errorResponse(
          '건강정보를 찾을 수 없습니다',
          404
        ));
      }

      logger.info('Health info retrieved', {
        id: healthInfo._id,
        userId: req.userId,
        name: healthInfo.기본정보?.이름
      });

      res.json(successResponse(
        { healthInfo },
        '건강정보를 조회했습니다'
      ));
    } catch (error) {
      logger.error('Get health info error:', error);
      res.status(500).json(errorResponse(
        '건강정보 조회 중 오류가 발생했습니다',
        500
      ));
    }
  }
);

// 건강정보 수정
router.put('/:id',
  auth,
  idParamRules(),
  healthInfoValidationRules(),
  validate,
  async (req, res) => {
    try {
      const healthInfo = await HealthInfo.findOneAndUpdate(
        {
          _id: req.params.id,
          userId: req.userId
        },
        req.body,
        { new: true, runValidators: true }
      );

      if (!healthInfo) {
        return res.status(404).json(errorResponse(
          '건강정보를 찾을 수 없습니다',
          404
        ));
      }

      logger.info('Health info updated', {
        id: healthInfo._id,
        userId: req.userId,
        name: healthInfo.기본정보?.이름
      });

      res.json(successResponse(
        { healthInfo },
        '건강정보가 수정되었습니다'
      ));
    } catch (error) {
      logger.error('Update health info error:', error);
      res.status(500).json(errorResponse(
        '건강정보 수정 중 오류가 발생했습니다',
        500
      ));
    }
  }
);

// 건강정보 삭제
router.delete('/:id',
  auth,
  idParamRules(),
  validate,
  async (req, res) => {
    try {
      const healthInfo = await HealthInfo.findOneAndDelete({
        _id: req.params.id,
        userId: req.userId
      });

      if (!healthInfo) {
        return res.status(404).json(errorResponse(
          '건강정보를 찾을 수 없습니다',
          404
        ));
      }

      logger.info('Health info deleted', {
        id: healthInfo._id,
        userId: req.userId,
        name: healthInfo.기본정보?.이름
      });

      res.json(successResponse(
        null,
        '건강정보가 삭제되었습니다'
      ));
    } catch (error) {
      logger.error('Delete health info error:', error);
      res.status(500).json(errorResponse(
        '건강정보 삭제 중 오류가 발생했습니다',
        500
      ));
    }
  }
);

module.exports = router;