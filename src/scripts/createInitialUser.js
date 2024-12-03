const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();
const { User } = require('../models');

async function createInitialUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('MongoDB에 연결되었습니다.');

    // 기존 사용자 확인
    const existingUser = await User.findOne({ email: 'test@example.com' });
    if (existingUser) {
      console.log('이미 테스트 사용자가 존재합니다.');
      await mongoose.connection.close();
      return;
    }

    const hashedPassword = await bcrypt.hash('test1234', 10);
    
    const user = await User.create({
      email: 'test@example.com',
      password: hashedPassword,
      name: '테스트 사용자'
    });

    console.log('초기 사용자가 생성되었습니다:', user);
    await mongoose.connection.close();
  } catch (error) {
    console.error('초기 사용자 생성 실패:', error);
    await mongoose.connection.close();
  }
}

createInitialUser();
