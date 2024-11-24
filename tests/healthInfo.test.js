const request = require('supertest');
const app = require('../server');
const HealthInfo = require('../models/HealthInfo');
const User = require('../models/User');

describe('Health Info API', () => {
  let token;
  let userId;

  beforeAll(async () => {
    // 테스트용 사용자 생성 및 토큰 발급
    const userResponse = await request(app)
      .post('/api/users/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        name: '테스트사용자'
      });
    
    token = userResponse.body.token;
    userId = userResponse.body.user._id;
  });

  const sampleHealthInfo = {
    기본정보: {
      이름: '홍길동',
      주민번호: '800101-1234567',
      연락처: '010-1234-5678',
      성별: '남',
      나이: 43,
      키: 175,
      체중: 70,
      BMI: 22.9
    },
    건강정보: {
      혈압: {
        수축기: 120,
        이완기: 80
      },
      혈당: 95,
      체온: 36.5,
      산소포화도: 98
    },
    증상: ['두통', '어지러움'],
    메모: '특이사항 없음'
  };

  describe('POST /api/health-info', () => {
    it('should create new health info', async () => {
      const response = await request(app)
        .post('/api/health-info')
        .set('Authorization', `Bearer ${token}`)
        .send(sampleHealthInfo);

      expect(response.status).toBe(201);
      expect(response.body.data.기본정보.이름).toBe('홍길동');
      expect(response.body.data.건강정보.혈압.수축기).toBe(120);
      expect(response.body.status).toBe('success');
    });

    it('should not create health info without token', async () => {
      const response = await request(app)
        .post('/api/health-info')
        .send(sampleHealthInfo);

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });
  });

  describe('GET /api/health-info', () => {
    beforeEach(async () => {
      // 테스트 데이터 생성
      await HealthInfo.create({
        ...sampleHealthInfo,
        userId
      });
    });

    it('should get all health info', async () => {
      const response = await request(app)
        .get('/api/health-info')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBeTruthy();
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.status).toBe('success');
    });

    it('should not get health info without token', async () => {
      const response = await request(app)
        .get('/api/health-info');

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });
  });

  describe('GET /api/health-info/:id', () => {
    let healthInfo;

    beforeEach(async () => {
      // 테스트 데이터 생성
      healthInfo = await HealthInfo.create({
        ...sampleHealthInfo,
        userId
      });
    });

    it('should get health info by id', async () => {
      const response = await request(app)
        .get(`/api/health-info/${healthInfo._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.기본정보.이름).toBe('홍길동');
      expect(response.body.status).toBe('success');
    });

    it('should return 404 if id not found', async () => {
      const response = await request(app)
        .get('/api/health-info/654321654321654321654321')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.status).toBe('error');
    });
  });

  afterEach(async () => {
    await HealthInfo.deleteMany();
  });

  afterAll(async () => {
    await User.deleteMany();
  });
});