const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const HealthInfo = require('../models/HealthInfo');
const jwt = require('jsonwebtoken');

// 컨트롤러 함수들 mock
jest.mock('../controllers/userController', () => ({
    registerUser: jest.fn(),
    loginUser: jest.fn(),
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
}));

describe('Health Info Import Tests', () => {
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
    });

    afterEach(async () => {
        // 테스트 데이터 정리
        await User.deleteMany({});
        await HealthInfo.deleteMany({});
        
        // Mock 초기화
        jest.clearAllMocks();
    });

    test('should import health info from CSV', async () => {
        const csvContent = 
            'Date,Weight,Height,Systolic,Diastolic,Steps\n' +
            '2024-01-01,70.5,175,120,80,8000\n' +
            '2024-01-02,70.3,175,118,79,10000';

        const response = await request(app)
            .post('/api/health-info/import')
            .set('Authorization', `Bearer ${token}`)
            .attach('file', Buffer.from(csvContent), {
                filename: 'health-info.csv',
                contentType: 'text/csv'
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.imported).toBe(2);

        // DB에 데이터가 정상적으로 저장되었는지 확인
        const healthInfos = await HealthInfo.find({ userId: testUser._id });
        expect(healthInfos).toHaveLength(2);
    });

    test('should reject invalid CSV format', async () => {
        const csvContent = 
            'InvalidHeader1,InvalidHeader2\n' +
            'value1,value2';

        const response = await request(app)
            .post('/api/health-info/import')
            .set('Authorization', `Bearer ${token}`)
            .attach('file', Buffer.from(csvContent), {
                filename: 'invalid.csv',
                contentType: 'text/csv'
            });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('올바르지 않은 CSV 형식입니다');
    });

    test('should handle missing file', async () => {
        const response = await request(app)
            .post('/api/health-info/import')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('파일이 업로드되지 않았습니다');
    });
}); 