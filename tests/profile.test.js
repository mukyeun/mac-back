const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { describe, test, expect, beforeEach } = require('@jest/globals');

describe('Profile Tests', () => {
  let existingUser;
  let testUser;
  let token;
  let expiredToken;

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
      username: 'testuser',
      password: 'Password123!'
    });

    // 토큰 생성
    token = jwt.sign(
      { userId: testUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    expiredToken = jwt.sign(
      { userId: testUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '0s' }
    );
  });

  test('should not update profile with duplicate username', async () => {
    const response = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ 
        username: 'existinguser'  // 이미 존재하는 username
      });

    // 검증
    expect(response.status).toBe(400);
    expect(response.body.errors[0].message).toBe('이미 사용 중인 사용자명입니다');

    // DB에서 사용자 확인
    const unchangedUser = await User.findById(testUser._id);
    expect(unchangedUser.username).toBe('testuser');
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

  // 1. 잘못된 형식의 username 테스트
  test('should not update profile with invalid username format', async () => {
    const response = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ 
        username: 'invalid@username' 
      });

    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toMatch(/사용자명은 영문, 숫자, 언더스코어만 사용할 수 있습니다/);
  });

  // 2. 잘못된 형식의 name 테스트
  test('should not update profile with invalid name length', async () => {
    const response = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ 
        name: 'A' // 2자 미만
      });

    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toMatch(/이름은 2-50자 사이여야 합니다/);
  });

  // 3. 토큰 없는 요청 테스트
  test('should not allow profile update without token', async () => {
    const response = await request(app)
      .put('/api/users/profile')
      .send({ 
        name: 'New Name' 
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('인증이 필요합니다');
  });

  // 4. 만료된 토큰 테스트
  test('should not allow profile update with expired token', async () => {
    // 잠시 대기하여 토큰이 만료되도록 함
    await new Promise(resolve => setTimeout(resolve, 1000));

    const response = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${expiredToken}`)
      .send({ 
        name: 'New Name' 
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('유효하지 않은 토큰입니다');
  });

  // 5. 잘못된 형식의 토큰 테스트
  test('should not allow profile update with malformed token', async () => {
    const response = await request(app)
      .put('/api/users/profile')
      .set('Authorization', 'Bearer invalid.token.here')
      .send({ 
        name: 'New Name' 
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('유효하지 않은 토큰입니다');
  });
});
