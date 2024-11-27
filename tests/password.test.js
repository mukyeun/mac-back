const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const { connectDB, clearDB, closeDB } = require('./testDb');

describe('Password Change Tests', () => {
  let token;
  let testUser;

  beforeAll(async () => {
    await connectDB();
  });

  beforeEach(async () => {
    await clearDB();
    
    // 테스트 사용자 생성
    const userData = {
      email: 'test@example.com',
      password: 'oldPassword123!',  // 초기 비밀번호 변경
      name: 'Test User',
      username: 'testuser'
    };

    const response = await request(app)
      .post('/api/users/register')
      .send(userData);

    token = response.body.token;
    testUser = response.body.user;
  });

  afterAll(async () => {
    await closeDB();
  });

  test('should change password successfully', async () => {
    const loginData = { 
      email: 'test@example.com', 
      password: 'newPassword123!' 
    };

    // 비밀번호 변경 요청
    const passwordChangeResponse = await request(app)
      .put('/api/users/password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'oldPassword123!',
        newPassword: 'newPassword123!',
      });

    console.log('Password Change Response:', passwordChangeResponse.body);
    expect(passwordChangeResponse.status).toBe(200);

    // 비밀번호 변경이 DB에 반영될 때까지 잠시 대기
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 비밀번호 변경 후 새 비밀번호로 로그인 시도
    const loginResponse = await request(app)
      .post('/api/users/login')
      .send(loginData);

    console.log('Login Data:', loginData);
    console.log('Login Response:', loginResponse.body);
    console.log('Login Status:', loginResponse.status);

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.token).toBeDefined();
  });

  it('should not change password with incorrect current password', async () => {
    const response = await request(app)
      .put('/api/users/password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'WrongPassword123!',
        newPassword: 'NewTest1234!'
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('현재 비밀번호가 일치하지 않습니다');
  });

  it('should not change password with invalid new password format', async () => {
    const response = await request(app)
      .put('/api/users/password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'Test1234!',
        newPassword: 'weak'
      });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      {
        location: 'body',
        msg: '비밀번호는 최소 8자 이상이어야 합니다',
        path: 'newPassword',
        type: 'field',
        value: 'weak'
      },
      {
        location: 'body',
        msg: '비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다',
        path: 'newPassword',
        type: 'field',
        value: 'weak'
      }
    ]);
  });

  it('should not change password without authentication', async () => {
    const response = await request(app)
      .put('/api/users/password')
      .send({
        currentPassword: 'Test1234!',
        newPassword: 'NewTest1234!'
      });

    expect(response.status).toBe(401);
  });
}); 
