const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer = null;

beforeAll(async () => {
    try {
        // MongoMemoryServer 인스턴스 생성 및 시작 대기
        mongoServer = await MongoMemoryServer.create();
        
        // URI를 가져오기 전에 서버가 실행 중인지 확인
        if (!mongoServer) {
            throw new Error('MongoMemoryServer failed to start');
        }
        
        // URI 가져오기 (await 사용)
        const uri = await mongoServer.getUri();
        
        // Mongoose 연결
        await mongoose.connect(uri);
        
        // 환경 변수 설정
        process.env.MONGO_URI_TEST = uri;
        process.env.JWT_SECRET = 'test-secret-key';
        
        console.log('Test database connected');
        console.log('MONGO_URI:', process.env.MONGO_URI_TEST);
        console.log('Mongoose connection state:', mongoose.connection.readyState);
    } catch (error) {
        console.error('Database setup failed:', error);
        throw error;
    }
});

afterEach(async () => {
    try {
        if (mongoose.connection.readyState !== 0) {
            const collections = mongoose.connection.collections;
            for (const key in collections) {
                await collections[key].deleteMany();
            }
            console.log('Collections cleared');
        }
    } catch (error) {
        console.error('Collection cleanup failed:', error);
    }
});

afterAll(async () => {
    try {
        // Mongoose 연결 종료
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        
        // MongoMemoryServer 종료
        if (mongoServer) {
            await mongoServer.stop();
            console.log('Test database disconnected');
        }
    } catch (error) {
        console.error('Database teardown failed:', error);
        throw error;
    }
});

jest.setTimeout(30000);

module.exports = {
    MONGO_URI: process.env.MONGO_URI_TEST
};