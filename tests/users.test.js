const request = require('supertest');
const app = require('../server');
const User = require('../models/User');

describe('User API', () => {
  const sampleUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    name: '테스트 사용자'
  };

  describe('POST /api/users/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/users/register')
        .send(sampleUser);

      expect(response.status).toBe(201);
      expect(response.body.user.username).toBe(sampleUser.username);
      expect(response.body.user.email).toBe(sampleUser.email);
      expect(response.body.token).toBeDefined();
    });

    it('should not register user with duplicate email', async () => {
      // 첫 번째 사용자 등록
      await request(app)
        .post('/api/users/register')
        .send(sampleUser);

      // 같은 이메일로 두 번째 사용자 등록 시도
      const response = await request(app)
        .post('/api/users/register')
        .send(sampleUser);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/users/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/users/register')
        .send(sampleUser);
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: sampleUser.email,
          password: sampleUser.password
        });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe(sampleUser.email);
    });

    it('should not login with invalid password', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: sampleUser.email,
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/users/profile', () => {
    let token;

    beforeEach(async () => {
      // 사용자 등록
      const registerResponse = await request(app)
        .post('/api/users/register')
        .send(sampleUser);
      
      token = registerResponse.body.token;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.email).toBe(sampleUser.email);
    });

    it('should not get profile without token', async () => {
      const response = await request(app)
        .get('/api/users/profile');

      expect(response.status).toBe(401);
    });
  });
});