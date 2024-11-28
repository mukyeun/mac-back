const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const HealthInfo = require('../models/HealthInfo');
const jwt = require('jsonwebtoken');

describe('Health Info Chart Tests', () => {
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
            },
            {
                userId: testUser._id,
                date: new Date('2024-01-03'),
                weight: 70.1,
                height: 175,
                bloodPressure: {
                    systolic: 122,
                    diastolic: 81
                },
                steps: 7500
            }
        ];

        await HealthInfo.insertMany(healthData);
    });

    afterEach(async () => {
        await User.deleteMany({});
        await HealthInfo.deleteMany({});
    });

    test('should get weight chart data', async () => {
        const response = await request(app)
            .get('/api/health-info/chart/weight')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.labels).toHaveLength(3);
        expect(response.body.data.datasets).toBeDefined();
        expect(response.body.data.datasets[0].data).toHaveLength(3);
        expect(response.body.data.datasets[0].data).toContain(70.5);
    });

    test('should get blood pressure chart data', async () => {
        const response = await request(app)
            .get('/api/health-info/chart/blood-pressure')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.labels).toHaveLength(3);
        expect(response.body.data.datasets).toHaveLength(2); // systolic & diastolic
        expect(response.body.data.datasets[0].data).toContain(120);
        expect(response.body.data.datasets[1].data).toContain(80);
    });

    test('should get steps chart data', async () => {
        const response = await request(app)
            .get('/api/health-info/chart/steps')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.labels).toHaveLength(3);
        expect(response.body.data.datasets[0].data).toContain(8000);
    });

    test('should filter chart data by date range', async () => {
        const response = await request(app)
            .get('/api/health-info/chart/weight')
            .query({
                startDate: '2024-01-01',
                endDate: '2024-01-02'
            })
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.data.labels).toHaveLength(2);
        expect(response.body.data.datasets[0].data).toHaveLength(2);
    });

    test('should handle invalid metric type', async () => {
        const response = await request(app)
            .get('/api/health-info/chart/invalid')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('지원하지 않는 지표입니다');
    });

    test('should handle no data found', async () => {
        await HealthInfo.deleteMany({ userId: testUser._id });

        const response = await request(app)
            .get('/api/health-info/chart/weight')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('차트 데이터가 없습니다');
    });
}); 