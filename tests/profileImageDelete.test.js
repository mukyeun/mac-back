const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const { describe, test, expect, beforeEach, afterAll } = require('@jest/globals');

describe('Profile Delete Tests', () => {
  let testUser;
  let token;

  beforeEach(async () => {
    // 테스트 사용자 생성
    testUser = await User.create({
      email: 'test@example.com',
      name: 'Test User',
      username: 'testuser',
      password: 'Password123!',
      profileImage: '/uploads/test-profile.jpg'
    });

    // 토큰 생성
    token = jwt.sign(
      { userId: testUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 테스트 이미지 파일 생성
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const testImagePath = path.join(uploadsDir, 'test-profile.jpg');
    if (!fs.existsSync(testImagePath)) {
      fs.copyFileSync(
        path.join(__dirname, 'fixtures/test-image.jpg'),
        testImagePath
      );
    }
  });

  afterAll(async () => {
    // 테스트 후 정리
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = await fs.promises.readdir(uploadsDir);
      await Promise.all(
        files.map(file => fs.promises.unlink(path.join(uploadsDir, file)))
      );
    }
  });

  test('should successfully delete profile image', async () => {
    const response = await request(app)
      .delete('/api/users/profile/image')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('프로필 이미지가 삭제되었습니다');
    expect(response.body.user.profileImage).toBeNull();

    // DB에서 사용자 확인
    const updatedUser = await User.findById(testUser._id);
    expect(updatedUser.profileImage).toBeNull();
  });

  test('should not delete profile image without authentication', async () => {
    const response = await request(app)
      .delete('/api/users/profile/image')
      .send({});

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: '인증이 필요합니다'
    });
  });

  test('should handle case when no profile image exists', async () => {
    // 프로필 이미지를 null로 설정
    await User.findByIdAndUpdate(testUser._id, { profileImage: null });

    const response = await request(app)
      .delete('/api/users/profile/image')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: '삭제할 프로필 이미지가 없습니다'
    });
  });
}); 