const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const Symptom = require('../models/Symptom');
const { generateToken } = require('../utils/token');

describe('Symptom API', () => {
  let token;
  let userId;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    userId = new mongoose.Types.ObjectId();
    token = generateToken({ id: userId });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Symptom.deleteMany({});
  });

  const sampleSymptom = {
    category: '두통',
    description: '오후부터 두통이 시작됨',
    severity: 5,
    duration: '2시간',
    notes: '물을 충분히 마시고 휴식 취함',
    date: new Date().toISOString()
  };

  describe('POST /api/symptoms', () => {
    it('should create new symptom', async () => {
      const response = await request(app)
        .post('/api/symptoms')
        .set('Authorization', `Bearer ${token}`)
        .send(sampleSymptom);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.category).toBe(sampleSymptom.category);
      expect(response.body.data.description).toBe(sampleSymptom.description);
    }, 30000);

    it('should not create symptom without token', async () => {
      const response = await request(app)
        .post('/api/symptoms')
        .send(sampleSymptom);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    }, 30000);
  });

  describe('GET /api/symptoms', () => {
    beforeEach(async () => {
      await Symptom.create({
        ...sampleSymptom,
        userId
      });
    });

    it('should get all symptoms', async () => {
      const response = await request(app)
        .get('/api/symptoms')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    }, 30000);

    it('should not get symptoms without token', async () => {
      const response = await request(app)
        .get('/api/symptoms');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    }, 30000);
  });

  describe('GET /api/symptoms/:id', () => {
    let symptomId;

    beforeEach(async () => {
      const symptom = await Symptom.create({
        ...sampleSymptom,
        userId
      });
      symptomId = symptom._id;
    });

    it('should get symptom by id', async () => {
      const response = await request(app)
        .get(`/api/symptoms/${symptomId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.category).toBe(sampleSymptom.category);
    }, 30000);

    it('should return 404 if symptom not found', async () => {
      const response = await request(app)
        .get(`/api/symptoms/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    }, 30000);
  });
});