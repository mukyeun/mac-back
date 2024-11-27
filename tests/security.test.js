const request = require('supertest');
const mongoose = require('mongoose');
const User = require('../models/User');
const logger = require('../utils/logger');
const app = require('../server');

describe('Security Tests', () => {
  let server;
  const MONGODB_URI = 'mongodb://localhost:27017/test-db';

  beforeAll(async () => {
    try {
      // 서버 시작
      server = app.listen(0);
      const port = server.address().port;

      // 기존 연결이 있다면 끊기
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }

      // MongoDB 연결 옵션 수정
      const mongooseOpts = {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 10000,
        connectTimeoutMS: 10000
      };

      // 테스트 데이터베이스 연결
      await mongoose.connect(MONGODB_URI, mongooseOpts);
      
      // 연결 이벤트 리스너
      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected during test');
      });

      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB error during test:', err);
      });

      logger.info('Test environment ready:', {
        port,
        database: mongoose.connection.name,
        serverRunning: !!server.listening,
        mongooseState: mongoose.connection.readyState,
        uri: MONGODB_URI
      });
    } catch (error) {
      logger.error('Setup failed:', error);
      throw error;
    }
  });

  afterAll(async () => {
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
      await new Promise(resolve => server.close(resolve));
      logger.info('Test environment cleaned up');
    } catch (error) {
      logger.error('Cleanup failed:', error);
      throw error;
    }
  });

  beforeEach(async () => {
    try {
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.db.dropDatabase();
        logger.debug('Database cleaned');
      }
    } catch (error) {
      logger.error('Database cleanup failed:', error);
      throw error;
    }
  });

  it('should register a user successfully', async () => {
    const testUser = {
      email: 'test@example.com',
      password: 'Test@1234',
      name: 'Test User',
      username: 'testuser'
    };

    logger.info('Sending registration request');

    try {
      const response = await request(server) // app 대신 server 사용
        .post('/api/users/register')
        .send(testUser)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .timeout(5000); // 요청 타임아웃 설정

      logger.info('Response received:', {
        status: response.status,
        hasToken: !!response.body.token,
        body: response.body
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toEqual({
        email: testUser.email,
        name: testUser.name,
        username: testUser.username
      });

      const savedUser = await User.findOne({ email: testUser.email });
      expect(savedUser).toBeTruthy();
      
      logger.info('Test completed successfully');
    } catch (error) {
      logger.error('Test failed:', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }, 10000); // 테스트 타임아웃 감소

  it('should not register user with invalid password format', async () => {
    const testCases = [
      {
        password: 'short',
        message: '비밀번호는 최소 8자 이상이어야 합니다'
      },
      {
        password: '12345678',
        message: '비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다'
      },
      {
        password: 'password123',
        message: '비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다'
      },
      {
        password: 'Password123',
        message: '비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다'
      }
    ];

    for (const testCase of testCases) {
      logger.info('Testing invalid password:', {
        password: testCase.password.replace(/./g, '*'),
        expectedMessage: testCase.message
      });

      const response = await request(server)
        .post('/api/users/register')
        .send({
          email: 'test@example.com',
          password: testCase.password,
          name: 'Test User',
          username: 'testuser'
        })
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json');

      logger.info('Invalid password response:', {
        status: response.status,
        errors: response.body.errors
      });

      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'password',
            message: testCase.message
          })
        ])
      );

      // 각 테스트 케이스 후 데이터베이스 초기화
      await mongoose.connection.db.dropDatabase();
    }
    
    logger.info('Invalid password test completed successfully');
  }, 15000);

  it('should not register user with missing required fields', async () => {
    const testCases = [
      {
        omit: 'email',
        message: '이메일은 필수 입력 항목입니다'
      },
      {
        omit: 'password',
        message: '비밀번호는 필수 입력 항목입니다'
      },
      {
        omit: 'name',
        message: '이름은 필수 입력 항목입니다'
      },
      {
        omit: 'username',
        message: '사용자 이름은 필수 입력 항목입니다'
      }
    ];

    const baseUser = {
      email: 'test@example.com',
      password: 'Test@1234',
      name: 'Test User',
      username: 'testuser'
    };

    for (const testCase of testCases) {
      const testUser = { ...baseUser };
      delete testUser[testCase.omit];

      logger.info('Testing missing field:', {
        omittedField: testCase.omit,
        expectedMessage: testCase.message
      });

      const response = await request(server)
        .post('/api/users/register')
        .send(testUser)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json');

      logger.info('Missing field response:', {
        status: response.status,
        errors: response.body.errors
      });

      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: testCase.omit,
            message: testCase.message
          })
        ])
      );

      // 각 테스트 케이스 후 데이터베이스 초기화
      await mongoose.connection.db.dropDatabase();
    }
    
    logger.info('Missing fields test completed successfully');
  }, 15000);
});
