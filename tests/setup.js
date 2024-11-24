const mongoose = require('mongoose');
require('dotenv').config();

// JWT_SECRET이 없으면 테스트용 시크릿 설정
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

// 테스트 데이터베이스 연결 설정
beforeAll(async () => {
  const url = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/health-info-test';
  await mongoose.connect(url);
});

// 각 테스트 후 데이터베이스 정리
afterEach(async () => {
  const collections = await mongoose.connection.db.collections();
  for (let collection of collections) {
    await collection.deleteMany({});
  }
});

// 모든 테스트 완료 후 연결 종료
afterAll(async () => {
  await mongoose.connection.close();
});