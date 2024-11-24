const HealthInfo = require('../models/HealthInfo');
const logger = require('../utils/logger');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

// 건강 정보 생성
exports.create = async (req, res) => {
  try {
    const healthInfo = new HealthInfo({
      ...req.body,
      userId: req.body.userId
    });
    const savedInfo = await healthInfo.save();
    logger.info(`새로운 건강정보 기록: ${savedInfo._id}`);
    
    res.status(201).json(successResponse(
      savedInfo,
      '건강정보가 성공적으로 생성되었습니다',
      201
    ));
  } catch (error) {
    logger.error('건강정보 생성 실패:', error);
    res.status(400).json(errorResponse(
      '건강정보 생성에 실패했습니다',
      400,
      error.message
    ));
  }
};

// 모든 건강 정보 조회
exports.getAll = async (req, res) => {
  try {
    const userId = req.query.userId;
    const query = userId ? { userId } : {};
    const healthInfos = await HealthInfo.find(query)
      .sort({ createdAt: -1 });
    
    res.json(successResponse(
      healthInfos,
      '건강정보 목록을 성공적으로 조회했습니다'
    ));
  } catch (error) {
    logger.error('건강정보 조회 실패:', error);
    res.status(500).json(errorResponse(
      '건강정보 조회에 실패했습니다',
      500,
      error.message
    ));
  }
};

// 특정 건강 정보 조회
exports.getById = async (req, res) => {
  try {
    const healthInfo = await HealthInfo.findOne({
      _id: req.params.id,
      userId: req.query.userId
    });
    
    if (!healthInfo) {
      return res.status(404).json(errorResponse(
        '건강정보를 찾을 수 없습니다',
        404
      ));
    }
    
    res.json(successResponse(
      healthInfo,
      '건강정보를 성공적으로 조회했습니다'
    ));
  } catch (error) {
    logger.error('건강정보 조회 실패:', error);
    res.status(500).json(errorResponse(
      '건강정보 조회에 실패했습니다',
      500,
      error.message
    ));
  }
};

// 건강 정보 검색
exports.search = async (req, res) => {
  try {
    const { type, keyword, startDate, endDate, userId } = req.query;
    let query = userId ? { userId } : {};

    if (type && keyword) {
      switch (type) {
        case 'name':
          query['기본정보.이름'] = new RegExp(keyword, 'i');
          break;
        case 'id':
          query['기본정보.주민번호'] = keyword;
          break;
        case 'phone':
          query['기본정보.연락처'] = keyword;
          break;
        case 'symptom':
          query['증상'] = new RegExp(keyword, 'i');
          break;
      }
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const healthInfos = await HealthInfo.find(query)
      .sort({ createdAt: -1 });
      
    res.json(successResponse(
      healthInfos,
      '건강정보 검색을 성공적으로 완료했습니다'
    ));
  } catch (error) {
    logger.error('건강정보 검색 실패:', error);
    res.status(500).json(errorResponse(
      '건강정보 검색에 실패했습니다',
      500,
      error.message
    ));
  }
};

// 건강 정보 수정
exports.update = async (req, res) => {
  try {
    const healthInfo = await HealthInfo.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.body.userId
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
    
    logger.info(`건강정보 수정: ${req.params.id}`);
    res.json(successResponse(
      healthInfo,
      '건강정보가 성공적으로 수정되었습니다'
    ));
  } catch (error) {
    logger.error('건강정보 수정 실패:', error);
    res.status(400).json(errorResponse(
      '건강정보 수정에 실패했습니다',
      400,
      error.message
    ));
  }
};

// 건강 정보 삭제
exports.delete = async (req, res) => {
  try {
    const healthInfo = await HealthInfo.findOneAndDelete({
      _id: req.params.id,
      userId: req.query.userId
    });
    
    if (!healthInfo) {
      return res.status(404).json(errorResponse(
        '건강정보를 찾을 수 없습니다',
        404
      ));
    }
    
    logger.info(`건강정보 삭제: ${req.params.id}`);
    res.json(successResponse(
      null,
      '건강정보가 성공적으로 삭제되었습니다'
    ));
  } catch (error) {
    logger.error('건강정보 삭제 실패:', error);
    res.status(500).json(errorResponse(
      '건강정보 삭제에 실패했습니다',
      500,
      error.message
    ));
  }
};

// 여러 건강정보 삭제
exports.deleteMultiple = async (req, res) => {
  try {
    const { ids } = req.body;
    const userId = req.query.userId;
    
    // 입력값 검증
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json(errorResponse(
        '삭제할 항목을 선택해주세요.',
        400
      ));
    }

    // userId가 있는 경우 해당 사용자의 데이터만 삭제
    const query = userId ? { _id: { $in: ids }, userId } : { _id: { $in: ids } };
    const deleteResult = await HealthInfo.deleteMany(query);

    // 삭제된 항목이 없는 경우
    if (deleteResult.deletedCount === 0) {
      return res.status(404).json(errorResponse(
        '삭제할 데이터를 찾을 수 없습니다.',
        404
      ));
    }

    logger.info(`다중 건강정보 삭제: ${ids.join(', ')}`);
    res.json(successResponse(
      { deletedCount: deleteResult.deletedCount },
      `${deleteResult.deletedCount}개의 건강정보가 성공적으로 삭제되었습니다.`
    ));

  } catch (error) {
    logger.error('다중 건강정보 삭제 실패:', error);
    res.status(500).json(errorResponse(
      '건강정보 삭제에 실패했습니다.',
      500,
      error.message
    ));
  }
};