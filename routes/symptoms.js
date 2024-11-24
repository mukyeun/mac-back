const express = require('express');
const router = express.Router();
const Symptom = require('../models/Symptom');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');
const { validate, symptomValidationRules } = require('../middleware/validators/symptomValidator');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

/**
 * @swagger
 * /api/symptoms:
 *   get:
 *     summary: 사용자의 모든 증상 조회
 *     tags: [증상]
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
 *                     $ref: '#/components/schemas/Symptom'
 *       401:
 *         description: 인증 실패
 *       500:
 *         description: 서버 에러
 */
router.get('/', auth, async (req, res) => {
  try {
    const symptoms = await Symptom.find({ userId: req.userId });
    res.json(successResponse(symptoms, '증상 목록 조회 성공'));
  } catch (err) {
    logger.error('증상 조회 실패:', err);
    res.status(500).json(errorResponse('증상 조회 실패', 500, err.message));
  }
});

/**
 * @swagger
 * /api/symptoms/{id}:
 *   get:
 *     summary: ID로 증상 조회
 *     tags: [증상]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 증상 ID
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
 *                   $ref: '#/components/schemas/Symptom'
 *       401:
 *         description: 인증 실패
 *       404:
 *         description: 증상을 찾을 수 없음
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const symptom = await Symptom.findOne({ 
      _id: req.params.id,
      userId: req.userId 
    });
    
    if (!symptom) {
      return res.status(404).json(errorResponse('증상을 찾을 수 없습니다', 404));
    }
    
    res.json(successResponse(symptom, '증상 조회 성공'));
  } catch (err) {
    logger.error('증상 조회 실패:', err);
    res.status(500).json(errorResponse('증상 조회 실패', 500, err.message));
  }
});

/**
 * @swagger
 * /api/symptoms/user/{userId}:
 *   get:
 *     summary: 특정 사용자의 모든 증상 조회
 *     tags: [증상]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 사용자 ID
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
 *                     $ref: '#/components/schemas/Symptom'
 *       401:
 *         description: 인증 실패
 *       500:
 *         description: 서버 에러
 */
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const symptoms = await Symptom.find({ userId: req.params.userId });
    res.json(successResponse(symptoms, '사용자 증상 목록 조회 성공'));
  } catch (err) {
    logger.error('증상 조회 실패:', err);
    res.status(500).json(errorResponse('증상 조회 실패', 500, err.message));
  }
});

/**
 * @swagger
 * /api/symptoms:
 *   post:
 *     summary: 새로운 증상 추가
 *     tags: [증상]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - category
 *               - description
 *             properties:
 *               category:
 *                 type: string
 *                 enum: [두통, 복통, 근육통, 기침, 기타]
 *                 example: 두통
 *               description:
 *                 type: string
 *                 example: 오후부터 지속된 두통
 *               severity:
 *                 type: string
 *                 enum: [약함, 보통, 심함]
 *                 example: 보통
 *               duration:
 *                 type: string
 *                 example: 2시간
 *               notes:
 *                 type: string
 *                 example: 약 복용 후 호전
 *               date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: 증상이 성공적으로 생성됨
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Symptom'
 *       401:
 *         description: 인증 실패
 *       400:
 *         description: 잘못된 요청
 */
router.post('/', auth, symptomValidationRules(), validate, async (req, res) => {
  const symptom = new Symptom({
    userId: req.userId,
    category: req.body.category,
    description: req.body.description,
    severity: req.body.severity,
    duration: req.body.duration,
    notes: req.body.notes,
    date: req.body.date || new Date()
  });

  try {
    const newSymptom = await symptom.save();
    logger.info(`새로운 증상 기록: ${newSymptom._id}`);
    res.status(201).json(successResponse(newSymptom, '증상 생성 성공', 201));
  } catch (err) {
    logger.error('증상 생성 실패:', err);
    res.status(400).json(errorResponse('증상 생성 실패', 400, err.message));
  }
});

/**
 * @swagger
 * /api/symptoms/{id}:
 *   put:
 *     summary: 증상 정보 수정
 *     tags: [증상]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 증상 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Symptom'
 *     responses:
 *       200:
 *         description: 성공적으로 수정됨
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Symptom'
 *       401:
 *         description: 인증 실패
 *       404:
 *         description: 증상을 찾을 수 없음
 */
router.put('/:id', auth, symptomValidationRules(), validate, async (req, res) => {
  try {
    const symptom = await Symptom.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!symptom) {
      return res.status(404).json(errorResponse('증상을 찾을 수 없습니다', 404));
    }

    const updatedSymptom = await Symptom.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    logger.info(`증상 정보 수정: ${req.params.id}`);
    res.json(successResponse(updatedSymptom, '증상 수정 성공'));
  } catch (err) {
    logger.error('증상 수정 실패:', err);
    res.status(400).json(errorResponse('증상 수정 실패', 400, err.message));
  }
});

/**
 * @swagger
 * /api/symptoms/{id}:
 *   delete:
 *     summary: 증상 삭제
 *     tags: [증상]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 증상 ID
 *     responses:
 *       200:
 *         description: 성공적으로 삭제됨
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: 증상이 성공적으로 삭제되었습니다
 *       401:
 *         description: 인증 실패
 *       404:
 *         description: 증상을 찾을 수 없음
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const symptom = await Symptom.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!symptom) {
      return res.status(404).json(errorResponse('증상을 찾을 수 없습니다', 404));
    }

    await Symptom.findByIdAndDelete(req.params.id);
    logger.info(`증상 삭제: ${req.params.id}`);
    res.json(successResponse(null, '증상이 성공적으로 삭제되었습니다'));
  } catch (err) {
    logger.error('증상 삭제 실패:', err);
    res.status(500).json(errorResponse('증상 삭제 실패', 500, err.message));
  }
});

module.exports = router;