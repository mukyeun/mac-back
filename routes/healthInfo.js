const express = require('express');
const router = express.Router();
const HealthInfo = require('../models/HealthInfo');

// 건강정보 목록 조회 (검색 기능 추가)
router.get('/', async (req, res) => {
  try {
    const { searchTerm } = req.query;
    let query = {};

    // 검색어가 있는 경우 이름으로 검색 조건 추가
    if (searchTerm) {
      query = {
        '기본정보.이름': { $regex: searchTerm, $options: 'i' }
      };
    }

    console.log('검색 쿼리:', query);  // 디버깅용

    const healthInfos = await HealthInfo.find(query).sort({ createdAt: -1 });
    res.json(healthInfos);
  } catch (error) {
    console.error('검색 오류:', error);  // 디버깅용
    res.status(500).json({ error: error.message });
  }
});

// 건강정보 상세 조회
router.get('/:id', async (req, res) => {
  try {
    const healthInfo = await HealthInfo.findById(req.params.id);
    if (!healthInfo) {
      return res.status(404).json({ message: '건강정보를 찾을 수 없습니다.' });
    }
    res.json(healthInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 건강정보 저장
router.post('/', async (req, res) => {
  try {
    const healthInfo = new HealthInfo(req.body);
    const savedInfo = await healthInfo.save();
    res.status(201).json(savedInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 건강정보 수정
router.put('/:id', async (req, res) => {
  try {
    const healthInfo = await HealthInfo.findByIdAndUpdate(
      req.params.id, 
      req.body,
      { new: true }
    );
    if (!healthInfo) {
      return res.status(404).json({ message: '건강정보를 찾을 수 없습니다.' });
    }
    res.json(healthInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 건강정보 삭제
router.delete('/:id', async (req, res) => {
  try {
    const healthInfo = await HealthInfo.findByIdAndDelete(req.params.id);
    if (!healthInfo) {
      return res.status(404).json({ message: '건강정보를 찾을 수 없습니다.' });
    }
    res.json({ message: '건강정보가 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 여러 건강정보 삭제
router.post('/multiple-delete', async (req, res) => {
  try {
    const { ids } = req.body;

    // 입력값 검증
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ 
        message: '삭제할 항목을 선택해주세요.' 
      });
    }

    // 여러 문서 삭제
    const result = await HealthInfo.deleteMany({ 
      _id: { $in: ids } 
    });

    // 삭제된 항목이 없는 경우
    if (result.deletedCount === 0) {
      return res.status(404).json({ 
        message: '삭제할 데이터를 찾을 수 없습니다.' 
      });
    }

    res.json({ 
      message: `${result.deletedCount}개의 건강정보가 삭제되었습니다.`,
      deletedCount: result.deletedCount 
    });

  } catch (error) {
    console.error('다중 삭제 오류:', error);
    res.status(500).json({ 
      error: '삭제 처리 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
});

module.exports = router;