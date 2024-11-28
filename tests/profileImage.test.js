const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const { describe, test, expect, beforeEach, afterAll } = require('@jest/globals');

describe('Profile Image Tests', () => {
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
  });

  // 테스트 후 업로드된 파일 정리
  afterAll(async () => {
    const directory = 'uploads';
    if (fs.existsSync(directory)) {
      const files = await fs.promises.readdir(directory);
      await Promise.all(
        files.map(file => fs.promises.unlink(path.join(directory, file)))
      );
    }
  });

  test('should successfully upload profile image', async () => {
    const response = await request(app)
      .put('/api/users/profile/image')
      .set('Authorization', `Bearer ${token}`)
      .attach('profileImage', path.join(__dirname, 'fixtures/test-image.jpg'));

    console.log('Response:', response.body);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('프로필 이미지가 업데이트되었습니다');
    expect(response.body.user).toBeDefined();
    expect(response.body.user.profileImage).toBeDefined();
    expect(response.body.user.profileImage).toMatch(/^\/uploads\//);

    // DB에서 사용자 확인
    const updatedUser = await User.findById(testUser._id);
    expect(updatedUser.profileImage).toBe(response.body.user.profileImage);
  });

  test('should not upload non-image file', async () => {
    const response = await request(app)
      .put('/api/users/profile/image')
      .set('Authorization', `Bearer ${token}`)
      .attach('profileImage', path.join(__dirname, 'fixtures/test-file.txt'));

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/지원하지 않는 파일 형식입니다/);
  });

  test('should not upload without authentication', async () => {
    // 파일 첨부 없이 요청만 보내기
    const response = await request(app)
      .put('/api/users/profile/image')
      .send({});  // 빈 객체 전송

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: '인증이 필요합니다'
    });
  });

  test('should not upload file larger than 5MB', async () => {
    const response = await request(app)
      .put('/api/users/profile/image')
      .set('Authorization', `Bearer ${token}`)
      .attach('profileImage', path.join(__dirname, 'fixtures/large-image.jpg'));

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/파일 크기는 5MB를 초과할 수 없습니다/);
  });
});

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