const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const HealthInfo = require('../models/HealthInfo');
const jwt = require('jsonwebtoken');
const { describe, test, expect, beforeEach } = require('@jest/globals');

describe('Health Info Get Tests', () => {
  let testUser;
  let token;
  let healthInfo;

  beforeEach(async () => {
    // 테스트 사용자 생성
    testUser = await User.create({
      email: 'test@example.com',
      name: 'Test User',
      username: 'testuser',
      password: 'Password123!'
    });

    // 토큰 생성
    token = jwt.sign(
      { userId: testUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 테스트용 건강 정보 생성
    healthInfo = await HealthInfo.create({
      userId: testUser._id,
      date: '2024-01-01',
      weight: 70.5,
      height: 175
    });
  });

  test('should get health info by date', async () => {
    const response = await request(app)
      .get('/api/health-info/2024-01-01')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.healthInfo).toMatchObject({
      date: '2024-01-01',
      weight: 70.5,
      height: 175
    });
  });

  test('should get health info list with pagination', async () => {
    // 추가 데이터 생성
    await HealthInfo.create({
      userId: testUser._id,
      date: '2024-01-02',
      weight: 70.3,
      height: 175
    });

    const response = await request(app)
      .get('/api/health-info')
      .set('Authorization', `Bearer ${token}`)
      .query({ page: 1, limit: 10 });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.healthInfos).toHaveLength(2);
    expect(response.body.pagination).toBeDefined();
    expect(response.body.pagination.totalDocs).toBe(2);
  });

  test('should not get health info without authentication', async () => {
    const response = await request(app)
      .get('/api/health-info/2024-01-01');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: '인증이 필요합니다'
    });
  });

  test('should return 404 for non-existent date', async () => {
    const response = await request(app)
      .get('/api/health-info/2024-12-31')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: '해당 날짜의 건강 정보를 찾을 수 없습니다'
    });
  });
}); 