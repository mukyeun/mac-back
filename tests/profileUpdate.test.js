const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { describe, test, expect, beforeEach } = require('@jest/globals');

describe('Profile Update Tests', () => {
  let testUser;
  let token;

  beforeEach(async () => {
    testUser = await User.create({
      email: 'test@example.com',
      name: 'Test User',
      username: 'testuser',
      password: 'Password123!',
      bio: '안녕하세요'
    });

    token = jwt.sign(
      { userId: testUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  test('should successfully update profile', async () => {
    const updateData = {
      name: 'Updated Name',
      bio: '프로필이 수정되었습니다',
      birthDate: '1990-01-01'
    };

    const response = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send(updateData);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('프로필이 업데이트되었습니다');
    expect(response.body.user).toMatchObject({
      name: updateData.name,
      bio: updateData.bio,
      birthDate: expect.any(String)
    });

    // DB 확인
    const updatedUser = await User.findById(testUser._id);
    expect(updatedUser.name).toBe(updateData.name);
    expect(updatedUser.bio).toBe(updateData.bio);
    expect(updatedUser.birthDate).toBeDefined();
  });

  test('should not update profile without authentication', async () => {
    const response = await request(app)
      .put('/api/users/profile')
      .send({ name: 'New Name' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: '인증이 필요합니다'
    });
  });

  test('should validate profile update data', async () => {
    const invalidData = {
      name: '', // 빈 이름
      bio: 'a'.repeat(501), // 너무 긴 자기소개
      birthDate: 'invalid-date' // 잘못된 날짜 형식
    };

    const response = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send(invalidData);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.errors).toBeDefined();
  });

  test('should not allow duplicate username', async () => {
    // 다른 사용자 생성
    await User.create({
      email: 'other@example.com',
      name: 'Other User',
      username: 'otherusername',
      password: 'Password123!'
    });

    const response = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'otherusername' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: '이미 사용 중인 사용자 이름입니다'
    });
  });
}); 