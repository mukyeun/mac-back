const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const HealthInfo = require('../models/HealthInfo');
const jwt = require('jsonwebtoken');
const { describe, test, expect, beforeEach } = require('@jest/globals');

describe('Health Info Modification Tests', () => {
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

  test('should update health info successfully', async () => {
    const updateData = {
      weight: 71.0,
      height: 175.5
    };

    const response = await request(app)
      .put(`/api/health-info/${healthInfo.date.toISOString().split('T')[0]}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('건강 정보가 업데이트되었습니다');
    expect(response.body.healthInfo).toMatchObject(updateData);

    // DB 확인
    const updatedHealthInfo = await HealthInfo.findById(healthInfo._id);
    expect(updatedHealthInfo.weight).toBe(updateData.weight);
    expect(updatedHealthInfo.height).toBe(updateData.height);
  });

  test('should delete health info successfully', async () => {
    const response = await request(app)
      .delete(`/api/health-info/${healthInfo.date.toISOString().split('T')[0]}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('건강 정보가 삭제되었습니다');

    // DB 확인
    const deletedHealthInfo = await HealthInfo.findById(healthInfo._id);
    expect(deletedHealthInfo).toBeNull();
  });

  test('should not update non-existent health info', async () => {
    const response = await request(app)
      .put('/api/health-info/2024-12-31')
      .set('Authorization', `Bearer ${token}`)
      .send({ weight: 71.0 });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: '해당 날짜의 건강 정보를 찾을 수 없습니다'
    });
  });

  test('should not delete non-existent health info', async () => {
    const response = await request(app)
      .delete('/api/health-info/2024-12-31')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: '해당 날짜의 건강 정보를 찾을 수 없습니다'
    });
  });
}); 