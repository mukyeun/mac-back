const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { 
  validate, 
  registerValidationRules, 
  loginValidationRules 
} = require('../middleware/validators/userValidator');
const logger = require('../utils/logger');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: 모든 사용자 조회
 *     tags: [사용자]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       500:
 *         description: 서버 에러
 */
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(successResponse(users, '사용자 목록 조회 성공'));
  } catch (err) {
    logger.error('사용자 조회 실패:', err);
    res.status(500).json(errorResponse('사용자 조회 실패', 500));
  }
});

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: 새로운 사용자 등록
 *     tags: [사용자]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - name
 *             properties:
 *               username:
 *                 type: string
 *                 example: user123
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *               name:
 *                 type: string
 *                 example: 홍길동
 *     responses:
 *       201:
 *         description: 사용자가 성공적으로 등록됨
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *       400:
 *         description: 잘못된 요청
 */
router.post('/register', registerValidationRules(), validate, async (req, res) => {
  try {
    const { username, email, password, name } = req.body;

    // 이메일 중복 확인
    const existingUser = await User.findOne({ 
      email: email.toLowerCase().trim() 
    });
    if (existingUser) {
      logger.warn('이미 존재하는 이메일로 가입 시도:', email);
      return res.status(400).json(errorResponse('이미 사용 중인 이메일입니다', 400));
    }

    // 사용자명 중복 확인
    const existingUsername = await User.findOne({ 
      username: username.toLowerCase().trim() 
    });
    if (existingUsername) {
      logger.warn('이미 존재하는 사용자명으로 가입 시도:', username);
      return res.status(400).json(errorResponse('이미 사용 중인 사용자명입니다', 400));
    }

    // 새 사용자 생성
    const user = new User({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password,
      name: name.trim(),
      role: 'user', // 기본 역할 설정
      isActive: true, // 기본적으로 활성화
      lastLogin: new Date() // 최초 로그인 시간 설정
    });
    
    const newUser = await user.save();
    
    const token = jwt.sign(
      { 
        userId: newUser._id,
        role: newUser.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    logger.info('새로운 사용자 등록 성공:', {
      userId: newUser._id,
      email: newUser.email,
      role: newUser.role,
      username: newUser.username
    });

    res.status(201).json(successResponse(
      { 
        user: {
          _id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          isActive: newUser.isActive,
          lastLogin: newUser.lastLogin
        }, 
        token 
      },
      '회원가입이 완료되었습니다'
    ));
  } catch (err) {
    console.error('회원가입 에러:', err);
    logger.error('사용자 등록 실패:', err);
    res.status(400).json(errorResponse('사용자 등록 실패', 400, err.message));
  }
});

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: 사용자 로그인
 *     tags: [사용자]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: 로그인 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *       401:
 *         description: 인증 실패
 */
router.post('/login', loginValidationRules(), validate, async (req, res) => {
  try {
    console.log('로그인 시도:', req.body);
    
    const user = await User.findOne({ email: req.body.email }).select('+password');
    console.log('찾은 사용자:', user ? '있음' : '없음');
    
    if (!user) {
      console.log('사용자를 찾을 수 없음:', req.body.email);
      return res.status(401).json(errorResponse(
        '이메일 또는 비밀번호가 잘못되었습니다',
        401
      ));
    }

    if (!user.isActive) {
      logger.warn('비활성화된 계정으로 로그인 시도:', req.body.email);
      return res.status(401).json(errorResponse(
        '비활성화된 계정입니다. 관리자에게 문의하세요.',
        401
      ));
    }

    const isMatch = await user.comparePassword(req.body.password);
    console.log('비밀번호 일치 여부:', isMatch);
    
    if (!isMatch) {
      console.log('비밀번호 불일치');
      return res.status(401).json(errorResponse(
        '이메일 또는 비밀번호가 잘못되었습니다',
        401
      ));
    }

    await user.updateLastLogin();

    const token = jwt.sign(
      { 
        userId: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    logger.info(`사용자 로그인: ${user.email}`, {
      userId: user._id,
      username: user.username,
      role: user.role,
      lastLogin: user.lastLogin
    });

    res.json(successResponse({
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        lastLogin: user.lastLogin,
        isActive: user.isActive
      },
      token
    }, '로그인 성공'));
  } catch (err) {
    console.error('로그인 에러:', err);
    logger.error('로그인 실패:', err);
    res.status(500).json(errorResponse('로그인 실패', 500, err.message));
  }
});

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: 사용자 프로필 조회
 *     tags: [사용자]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: 인증되지 않은 접근
 *       500:
 *         description: 서버 에러
 */
router.get('/profile', auth, async (req, res) => {
  try {
    console.log('프로필 조회 시도:', req.userId);
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      console.log('사용자를 찾을 수 없음:', req.userId);
      return res.status(404).json(errorResponse('사용자를 찾을 수 없습니다', 404));
    }
    console.log('프로필 조회 성공:', user.email);
    res.json(successResponse(user, '프로필 조회 성공'));
  } catch (err) {
    console.error('프로필 조회 에러:', err);
    logger.error('프로필 조회 실패:', err);
    res.status(500).json(errorResponse('프로필 조회 실패', 500, err.message));
  }
});

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: 사용자 프로필 업데이트
 *     tags: [사용자]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "홍길동"
 *               username:
 *                 type: string
 *                 example: "honggildong"
 *     responses:
 *       200:
 *         description: 프로필 업데이트 성공
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증되지 않은 접근
 */
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, username } = req.body;
    
    // 사용자명 중복 확인
    if (username) {
      const existingUser = await User.findOne({ 
        username, 
        _id: { $ne: req.userId } 
      });
      if (existingUser) {
        return res.status(400).json(
          errorResponse('이미 사용 중인 사용자명입니다', 400)
        );
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (username) updateData.username = username;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updateData },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json(
        errorResponse('사용자를 찾을 수 없습니다', 404)
      );
    }

    logger.info(`프로필 업데이트 성공: ${user.email}`);
    res.json(successResponse(user, '프로필이 성공적으로 업데이트되었습니다'));
  } catch (err) {
    console.error('프로필 업데이트 에러:', err);
    logger.error('프로필 업데이트 실패:', err);
    res.status(500).json(
      errorResponse('프로필 업데이트 실패', 500, err.message)
    );
  }
});

/**
 * @swagger
 * /api/users/change-password:
 *   post:
 *     summary: 비밀번호 변경
 *     tags: [사용자]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: "현재비밀번호"
 *               newPassword:
 *                 type: string
 *                 example: "새비밀번호"
 *     responses:
 *       200:
 *         description: 비밀번호 변경 성공
 *       401:
 *         description: 인증 실패
 *       400:
 *         description: 잘못된 요청
 */
router.post('/change-password', auth, async (req, res) => {
  try {
    console.log('비밀번호 변경 시도:', req.userId);
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      console.log('사용자를 찾을 수 없음:', req.userId);
      return res.status(404).json(errorResponse('사용자를 찾을 수 없습니다', 404));
    }

    const isMatch = await user.comparePassword(currentPassword);
    console.log('현재 비밀번호 일치 여부:', isMatch);
    
    if (!isMatch) {
      console.log('현재 비밀번호 불일치');
      return res.status(401).json(errorResponse('현재 비밀번호가 일치하지 않습니다', 401));
    }

    // 새 비밀번호 설정 - pre save 훅이 동작하도록 함
    user.password = newPassword;
    await user.save();

    console.log('비밀번호 변경 성공:', user.email);
    logger.info(`비밀번호 변경 성공: ${user.email}`);
    res.json(successResponse(null, '비밀번호가 성공적으로 변경되었습니다'));
  } catch (err) {
    console.error('비밀번호 변경 에러:', err);
    logger.error('비밀번호 변경 실패:', err);
    res.status(500).json(errorResponse('비밀번호 변경 실패', 500, err.message));
  }
});

/**
 * @swagger
 * /api/users/logout:
 *   post:
 *     summary: 사용자 로그아웃
 *     tags: [사용자]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 로그아웃 성공
 */
router.post('/logout', auth, (req, res) => {
  // 클라이언트 측에서 토큰을 삭제하도록 안내
  res.json(successResponse(null, '로그아웃 성공'));
});

module.exports = router;