const HealthInfo = require('../models/HealthInfo');
const logger = require('../utils/logger');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const Excel = require('exceljs');

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
          query['기본정보.주민등록번호'] = keyword;
          break;
        case 'phone':
          query['기본정보.연락처'] = keyword;
          break;
        case 'symptom':
          query['증상선택.증상'] = new RegExp(keyword, 'i');
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
      '건강정보가 ���공적으로 수정되었습니다'
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
        '삭제할 항목을 선택��주세요.',
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

// 엑셀 내보내기 기능
exports.exportToExcel = async (req, res) => {
  try {
    // 1. 데이터베이스 조회 (페이지네이션 응답 구조 확인)
    const response = await HealthInfo.find({})
      .lean()
      .sort({ createdAt: -1 });

    console.log('=== API Response Structure ===');
    console.log('Response data:', {
      total: response.length,
      sample: response[0]
    });

    // items 배열에서 실제 데이터 추출
    const healthInfos = response;

    if (!healthInfos || healthInfos.length === 0) {
      return res.status(404).json(errorResponse('내보낼 데이터가 없습니다.', 404));
    }

    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet('건강 정보');

    // 2. 실제 데이터 구조에 맞게 컬럼 정의
    worksheet.columns = [
      { header: '날짜', key: 'createdAt', width: 15 },
      { header: '이름', key: 'name', width: 10 },
      { header: '연락처', key: 'phone', width: 15 },
      { header: '나이', key: 'age', width: 8 },
      { header: '성별', key: 'gender', width: 8 },
      { header: '성격', key: 'personality', width: 10 },
      { header: 'BMI', key: 'bmi', width: 8 },
      { header: '스트레스', key: 'stress', width: 10 },
      { header: '노동강도', key: 'workIntensity', width: 10 },
      { header: '증상', key: 'symptoms', width: 30 },
      { header: '혈압', key: 'bloodPressure', width: 10 },
      { header: '복용약물', key: 'medications', width: 30 }
    ];

    // 3. 데이터 매핑 및 추가
    healthInfos.forEach((info, index) => {
      try {
        console.log(`\nProcessing record ${index + 1}:`, info);

        // DB 필��명에 맞게 데이터 매핑
        const rowData = {
          createdAt: info.createdAt ? new Date(info.createdAt).toLocaleDateString('ko-KR') : '',
          name: String(info.name || ''),
          phone: String(info.phone || ''),
          age: String(info.age || ''),
          gender: String(info.gender || ''),
          personality: String(info.personality || ''),
          bmi: String(info.bmi || ''),
          stress: String(info.stress || ''),
          workIntensity: String(info.workIntensity || ''),
          symptoms: Array.isArray(info.symptoms) ? info.symptoms.join(', ') : String(info.symptoms || ''),
          bloodPressure: String(info.bloodPressure || ''),
          medications: ''
        };

        // 복용약물 처리
        if (info.medications) {
          console.log('Processing medications:', info.medications);
          if (typeof info.medications === 'string') {
            try {
              const medicationObj = JSON.parse(info.medications);
              rowData.medications = Object.values(medicationObj).filter(Boolean).join(', ');
            } catch (e) {
              rowData.medications = info.medications;
            }
          } else if (typeof info.medications === 'object') {
            rowData.medications = Object.values(info.medications).filter(Boolean).join(', ');
          }
        }

        console.log('Mapped row data:', rowData);

        // 행 추가
        const row = worksheet.addRow(rowData);
        row.height = 25;

        // 셀 스타일 적용
        row.eachCell((cell) => {
          cell.alignment = { 
            vertical: 'middle',
            horizontal: 'left',
            wrapText: true
          };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });

      } catch (err) {
        console.error(`Error processing record ${index + 1}:`, err);
        console.error('Problematic data:', info);
      }
    });

    // 4. 헤더 스타일
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, size: 11 };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE5E5E5' }
    };

    // 5. 파일 생성 및 전송
    const now = new Date();
    const fileName = encodeURIComponent(`건강정보_${now.toISOString().slice(0, 10)}.xlsx`);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${fileName}`);

    console.log('\nWriting Excel file...');
    await workbook.xlsx.write(res);
    res.end();

    console.log(`Excel export completed: ${healthInfos.length} records`);
  } catch (error) {
    console.error('Excel export error:', error);
    if (!res.headersSent) {
      res.status(500).json(errorResponse('엑셀 파일 생성에 실패했습니다', 500, error.message));
    }
  }
};