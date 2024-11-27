const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const HealthInfo = require('../models/HealthInfo');
const { generateToken } = require('../utils/token');

describe('Health Info API Tests', () => {
  let authToken;
  let testUserId;

  beforeAll(async () => {
    testUserId = new mongoose.Types.ObjectId();
    authToken = generateToken({ 
      id: testUserId,
      role: 'user' 
    });
  }, 30000);

  beforeEach(async () => {
    await HealthInfo.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // 건강정보 생성 테스트
  describe('POST /api/health-info', () => {
    it('should create new health info with valid data', async () => {
      const healthData = {
        기본정보: {
          이름: '홍길동',
          성별: '남성',
          생년월일: '1990-01-01',
          혈액형: 'A'
        },
        weight: 70,
        height: 175,
        bloodPressure: {
          systolic: 120,
          diastolic: 80
        },
        pulseRate: 75,
        bloodSugar: 95,
        date: new Date().toISOString()
      };

      const response = await request(app)
        .post('/api/health-info')
        .set('Authorization', `Bearer ${authToken}`)
        .send(healthData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('weight', 70);
    }, 10000);

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        기본정보: {
          이름: '홍길동',
          성별: '남성',
          생년월일: '1990-01-01',
          혈액형: 'A'
        },
        weight: -1, // 잘못된 체중
        height: 175
      };

      const response = await request(app)
        .post('/api/health-info')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    }, 10000);
  });

  // 건강정보 조회 테스트
  describe('GET /api/health-info', () => {
    beforeEach(async () => {
      // 테스트 데이터 생성
      await HealthInfo.create({
        userId: testUserId,
        기본정보: {
          이름: '홍길동',
          성별: '남성',
          생년월일: '1990-01-01',
          혈액형: 'A'
        },
        weight: 70,
        height: 175,
        bloodPressure: {
          systolic: 120,
          diastolic: 80
        },
        pulseRate: 75,
        bloodSugar: 95,
        date: new Date()
      });
    });

    it('should get all health info for user', async () => {
      const response = await request(app)
        .get('/api/health-info')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    }, 30000);

    it('should filter health info by date range', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      
      const response = await request(app)
        .get('/api/health-info')
        .query({
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString()
        })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    }, 30000);
  });

  // 건강정보 수정 테스트
  describe('PUT /api/health-info/:id', () => {
    it('should update health info with valid data', async () => {
      const healthInfo = await HealthInfo.create({
        userId: testUserId,
        기본정보: {
          이름: '홍길동',
          성별: '남성',
          생년월일: '1990-01-01',
          혈액형: 'A'
        },
        weight: 70,
        height: 175
      });

      const updateData = {
        기본정보: {
          이름: '홍길동',
          성별: '남성',
          생년월일: '1990-01-01',
          혈액형: 'A'
        },
        weight: 72,
        height: 175
      };

      const response = await request(app)
        .put(`/api/health-info/${healthInfo._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.weight).toBe(72);
    }, 30000);

    it('should return 400 for invalid data', async () => {
      const healthInfo = await HealthInfo.create({
        userId: testUserId,
        기본정보: {
          이름: '홍길동',
          성별: '남성',
          생년월일: '1990-01-01',
          혈액형: 'A'
        },
        weight: 70,
        height: 175
      });

      const invalidData = {
        기본정보: {
          이름: '홍길동',
          성별: '남성',
          생년월일: '1990-01-01',
          혈액형: 'A'
        },
        weight: -1
      };

      const response = await request(app)
        .put(`/api/health-info/${healthInfo._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    }, 30000);
  });

  // 건강정보 삭제 테스트
  describe('DELETE /api/health-info/:id', () => {
    it('should delete health info', async () => {
      const healthInfo = await HealthInfo.create({
        userId: testUserId,
        기본정보: {
          이름: '홍길동',
          성별: '남성',
          생년월일: '1990-01-01',
          혈액형: 'A'
        },
        weight: 70,
        height: 175
      });

      const response = await request(app)
        .delete(`/api/health-info/${healthInfo._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    }, 30000);

    it('should return 404 if id not found', async () => {
      const response = await request(app)
        .delete(`/api/health-info/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    }, 30000);
  });
});