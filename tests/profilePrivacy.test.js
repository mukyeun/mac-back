const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { describe, test, expect, beforeEach } = require('@jest/globals');

describe('Profile Privacy Tests', () => {
  let testUser;
  let otherUser;
  let token;
  let otherToken;

  beforeEach(async () => {
    // 테스트 사용자 생성
    testUser = await User.create({
      email: 'test@example.com',
      name: 'Test User',
      username: 'testuser',
      password: 'Password123!',
      bio: '안녕하세요',
      isPublic: true
    });

    // 다른 사용자 생성
    otherUser = await User.create({
      email: 'other@example.com',
      name: 'Other User',
      username: 'otheruser',
      password: 'Password123!',
      bio: '다른 사용자입니다',
      isPublic: false
    });

    // 토큰 생성
    token = jwt.sign(
      { userId: testUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    otherToken = jwt.sign(
      { userId: otherUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  test('should successfully update profile privacy', async () => {
    const response = await request(app)
      .put('/api/users/profile/privacy')
      .set('Authorization', `Bearer ${token}`)
      .send({ isPublic: false });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('프로필 공개 설정이 업데이트되었습니다');
    expect(response.body.user.isPublic).toBe(false);

    // DB 확인
    const updatedUser = await User.findById(testUser._id);
    expect(updatedUser.isPublic).toBe(false);
  });

  test('should not update profile privacy without authentication', async () => {
    const response = await request(app)
      .put('/api/users/profile/privacy')
      .send({ isPublic: false });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: '인증이 필요합니다'
    });
  });

  test('should validate privacy setting value', async () => {
    const response = await request(app)
      .put('/api/users/profile/privacy')
      .set('Authorization', `Bearer ${token}`)
      .send({ isPublic: 'invalid' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('입력값이 유효하지 않습니다');
  });

  test('should get public profile successfully', async () => {
    const response = await request(app)
      .get(`/api/users/${testUser.username}/profile`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.user).toMatchObject({
      name: testUser.name,
      username: testUser.username,
      bio: testUser.bio
    });
  });

  test('should not get private profile', async () => {
    const response = await request(app)
      .get(`/api/users/${otherUser.username}/profile`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: '비공개 프로필입니다'
    });
  });
}); 