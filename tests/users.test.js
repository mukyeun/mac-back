const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const { generateToken } = require('../utils/token');

describe('User API', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  const sampleUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123'
  };

  describe('POST /api/users/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/users/register')
        .send(sampleUser);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe(sampleUser.username);
      expect(response.body.data.email).toBe(sampleUser.email);
    }, 30000);

    it('should not register user with duplicate email', async () => {
      await User.create(sampleUser);

      const response = await request(app)
        .post('/api/users/register')
        .send(sampleUser);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    }, 30000);
  });

  describe('POST /api/users/login', () => {
    beforeEach(async () => {
      await User.create(sampleUser);
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: sampleUser.email,
          password: sampleUser.password
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.data.email).toBe(sampleUser.email);
    }, 30000);

    it('should not login with invalid password', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: sampleUser.email,
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    }, 30000);
  });

  describe('GET /api/users/profile', () => {
    let token;

    beforeEach(async () => {
      const user = await User.create(sampleUser);
      token = generateToken({ id: user._id });
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(sampleUser.email);
    }, 30000);

    it('should not get profile without token', async () => {
      const response = await request(app)
        .get('/api/users/profile');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    }, 30000);
  });
});