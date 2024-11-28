const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const HealthInfo = require('../models/HealthInfo');
const jwt = require('jsonwebtoken');

describe('Health Info Statistics Tests', () => {
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

    test('should get statistics for all health metrics', async () => {
        const response = await request(app)
            .get('/api/health-info/stats')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.stats).toBeDefined();
        
        // 체중 통계 확인
        expect(response.body.stats.weight).toBeDefined();
        expect(response.body.stats.weight.avg).toBeCloseTo(70.3, 1);
        expect(response.body.stats.weight.min).toBe(70.1);
        expect(response.body.stats.weight.max).toBe(70.5);

        // 혈압 통계 확인
        expect(response.body.stats.bloodPressure).toBeDefined();
        expect(response.body.stats.bloodPressure.systolic.avg).toBeCloseTo(120, 0);
        expect(response.body.stats.bloodPressure.diastolic.avg).toBeCloseTo(80, 0);

        // 걸음 수 통계 확인
        expect(response.body.stats.steps).toBeDefined();
        expect(response.body.stats.steps.avg).toBeCloseTo(8500, 0);
        expect(response.body.stats.steps.total).toBe(25500);
    });

    test('should get statistics for specific date range', async () => {
        const response = await request(app)
            .get('/api/health-info/stats')
            .query({
                startDate: '2024-01-01',
                endDate: '2024-01-02'
            })
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.stats).toBeDefined();
        expect(response.body.stats.weight.avg).toBeCloseTo(70.4, 1);
    });

    test('should handle invalid date range', async () => {
        const response = await request(app)
            .get('/api/health-info/stats')
            .query({
                startDate: 'invalid-date',
                endDate: '2024-01-02'
            })
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('유효하지 않은 날짜 범위');
    });
}); 