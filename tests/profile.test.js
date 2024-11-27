const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { describe, test, expect, beforeEach } = require('@jest/globals');

describe('Profile Tests', () => {
  let existingUser;
  let testUser;
  let token;

  beforeEach(async () => {
    // 기존 사용자 생성
    existingUser = await User.create({
      email: 'existing@example.com',
      name: 'Existing User',
      username: 'existinguser',
      password: 'Password123!'
    });

    // 테스트 사용자 생성
    testUser = await User.create({
      email: 'test@example.com',
      name: 'Test User',
      username: 'originaluser',
      password: 'Password123!'
    });

    // JWT 토큰 생성
    token = jwt.sign(
      { userId: testUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  test('should not update profile with duplicate username', async () => {
    const response = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ 
        name: 'Updated Name',
        username: 'existinguser' 
      });

    // 검증
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('이미 사용 중인 사용자명입니다');

    // DB에서 사용자 확인
    const unchangedUser = await User.findById(testUser._id);
    expect(unchangedUser.username).toBe('originaluser');
  });

  test('should successfully update profile', async () => {
    const response = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ 
        name: 'New Name',
        username: 'newusername' 
      });

    // 검증
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('프로필이 성공적으로 업데이트되었습니다');
    expect(response.body.user.name).toBe('New Name');  // user 객체 내의 name 확인
    expect(response.body.user.username).toBe('newusername');  // user 객체 내의 username 확인

    // DB에서 사용자 확인
    const updatedUser = await User.findById(testUser._id);
    expect(updatedUser.name).toBe('New Name');
    expect(updatedUser.username).toBe('newusername');
  });
});
