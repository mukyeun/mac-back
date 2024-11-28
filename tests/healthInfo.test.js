const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const HealthInfo = require('../models/HealthInfo');
const jwt = require('jsonwebtoken');
const { describe, test, expect, beforeEach } = require('@jest/globals');

describe('Health Info Tests', () => {
  let testUser;
  let token;

  beforeEach(async () => {
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
  });

  test('should create health info successfully', async () => {
    const healthData = {
      date: '2024-01-01',
      weight: 70.5,
      height: 175
    };

    const response = await request(app)
      .post('/api/health-info')
      .set('Authorization', `Bearer ${token}`)
      .send(healthData);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.healthInfo).toMatchObject({
      weight: healthData.weight,
      height: healthData.height
    });

    // DB 확인
    const savedHealthInfo = await HealthInfo.findOne({ userId: testUser._id });
    expect(savedHealthInfo).toBeDefined();
    expect(savedHealthInfo.weight).toBe(healthData.weight);
    expect(savedHealthInfo.height).toBe(healthData.height);
  });

  test('should not create health info without authentication', async () => {
    const response = await request(app)
      .post('/api/health-info')
      .send({
        date: '2024-01-01',
        weight: 70.5,
        height: 175
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: '인증이 필요합니다'
    });
  });

  test('should validate required fields', async () => {
    const invalidData = {
      // date 누락
      weight: 70.5
      // height 누락
    };

    const response = await request(app)
      .post('/api/health-info')
      .set('Authorization', `Bearer ${token}`)
      .send(invalidData);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('입력값이 유효하지 않습니다');
  });
});