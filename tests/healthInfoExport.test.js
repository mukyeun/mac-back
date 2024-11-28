const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const HealthInfo = require('../models/HealthInfo');
const jwt = require('jsonwebtoken');

describe('Health Info Export Tests', () => {
    let testUser;
    let token;

    beforeEach(async () => {
        // 테스트 사용자 생성
        testUser = await User.create({
            email: 'test@example.com',
            username: 'testuser',
            password: 'Password123!',
            name: 'Test User'
        });

        // 테스트용 토큰 생성
        token = jwt.sign(
            { userId: testUser._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // 테스트용 건강 정보 데이터 생성
        const healthData = [
            {
                userId: testUser._id,
                date: new Date('2024-01-01'),
                weight: 70.5,
                height: 175,
                bloodPressure: {
                    systolic: 120,
                    diastolic: 80
                },
                steps: 8000
            },
            {
                userId: testUser._id,
                date: new Date('2024-01-02'),
                weight: 70.3,
                height: 175,
                bloodPressure: {
                    systolic: 118,
                    diastolic: 79
                },
                steps: 10000
            }
        ];

        await HealthInfo.insertMany(healthData);
    });

    afterEach(async () => {
        await User.deleteMany({});
        await HealthInfo.deleteMany({});
    });

    test('should export health info as CSV', async () => {
        const response = await request(app)
            .get('/api/health-info/export')
            .query({ format: 'csv' })
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toBe('text/csv; charset=utf-8');
        expect(response.headers['content-disposition']).toMatch(/^attachment; filename="health-info-\d{8}\.csv"$/);
        
        const csvContent = response.text;
        expect(csvContent).toContain('Date,Weight,Height,Systolic,Diastolic,Steps');
        expect(csvContent).toContain('2024-01-01,70.5,175,120,80,8000');
    });

    test('should export health info as JSON', async () => {
        const response = await request(app)
            .get('/api/health-info/export')
            .query({ format: 'json' })
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toBe('application/json; charset=utf-8');
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(2);
        expect(response.body.data[0]).toHaveProperty('date');
        expect(response.body.data[0]).toHaveProperty('weight', 70.5);
    });

    test('should filter by date range', async () => {
        const response = await request(app)
            .get('/api/health-info/export')
            .query({
                format: 'csv',
                startDate: '2024-01-01',
                endDate: '2024-01-01'
            })
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        const csvContent = response.text;
        expect(csvContent).toContain('2024-01-01,70.5,175,120,80,8000');
        expect(csvContent).not.toContain('2024-01-02');
    });

    test('should handle invalid format', async () => {
        const response = await request(app)
            .get('/api/health-info/export')
            .query({ format: 'invalid' })
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('지원하지 않는 형식입니다');
    });

    test('should handle no data found', async () => {
        await HealthInfo.deleteMany({ userId: testUser._id });

        const response = await request(app)
            .get('/api/health-info/export')
            .query({ format: 'csv' })
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('내보낼 데이터가 없습니다');
    });
}); 