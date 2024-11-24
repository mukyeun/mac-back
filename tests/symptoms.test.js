const request = require('supertest');
const app = require('../server');
const Symptom = require('../models/Symptom');

describe('Symptom API', () => {
  let token;
  const sampleSymptom = {
    category: '두통',
    description: '오후부터 두통이 시작됨',
    severity: 5,  // 문자열에서 숫자로 변경
    duration: '2시간',
    notes: '물을 충분히 마시고 휴식 취함',
    date: new Date().toISOString()
  };

  // 각 테스트 전에 사용자 등록 및 로그인
  beforeEach(async () => {
    const userResponse = await request(app)
      .post('/api/users/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        name: '테스트 사용자'
      });
    token = userResponse.body.token;
  });

  describe('POST /api/symptoms', () => {
    it('should create new symptom', async () => {
      const response = await request(app)
        .post('/api/symptoms')
        .set('Authorization', `Bearer ${token}`)
        .send(sampleSymptom);

      expect(response.status).toBe(201);
      expect(response.body.category).toBe(sampleSymptom.category);
      expect(response.body.description).toBe(sampleSymptom.description);
      expect(response.body.severity).toBe(sampleSymptom.severity);
    });

    it('should not create symptom without token', async () => {
      const response = await request(app)
        .post('/api/symptoms')
        .send(sampleSymptom);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/symptoms', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/symptoms')
        .set('Authorization', `Bearer ${token}`)
        .send(sampleSymptom);
    });

    it('should get all symptoms', async () => {
      const response = await request(app)
        .get('/api/symptoms')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should not get symptoms without token', async () => {
      const response = await request(app)
        .get('/api/symptoms');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/symptoms/:id', () => {
    let symptomId;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/symptoms')
        .set('Authorization', `Bearer ${token}`)
        .send(sampleSymptom);
      
      symptomId = response.body._id;
    });

    it('should get symptom by id', async () => {
      const response = await request(app)
        .get(`/api/symptoms/${symptomId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.category).toBe(sampleSymptom.category);
    });

    it('should return 404 if symptom not found', async () => {
      const response = await request(app)
        .get('/api/symptoms/654321654321654321654321')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });
});