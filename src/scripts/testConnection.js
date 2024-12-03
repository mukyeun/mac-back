const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('MongoDB URI:', process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('MongoDB 연결 성공!');
    
    // 데이터베이스 목록 조회
    const admin = mongoose.connection.db.admin();
    const databases = await admin.listDatabases();
    console.log('사용 가능한 데이터베이스:', databases.databases.map(db => db.name));
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('MongoDB 연결 실패:', error);
  }
}

testConnection();
