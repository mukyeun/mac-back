const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * 사용자 회원가입
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const registerUser = async (req, res) => {
    try {
        const { email, username, password, name } = req.body;

        // 이메일 중복 확인
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: '이미 사용 중인 이메일입니다'
            });
        }

        // 비밀번호 해싱
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 사용자 생성
        const user = await User.create({
            email,
            username,
            password: hashedPassword,
            name
        });

        // JWT 토큰 생성
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                name: user.name
            }
        });
    } catch (error) {
        logger.error('Registration error:', error);
        res.status(400).json({ 
            success: false,
            message: error.message 
        });
    }
};

/**
 * 사용자 로그인
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: '이메일 또는 비밀번호가 올바르지 않습니다'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: '이메일 또는 비밀번호가 올바르지 않습니다'
            });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                name: user.name
            }
        });
    } catch (error) {
        logger.error('Login error:', error);
        res.status(400).json({ 
            success: false,
            message: error.message 
        });
    }
};

/**
 * 프로필 조회
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다'
            });
        }
        res.json({ success: true, user });
    } catch (error) {
        logger.error('Get profile error:', error);
        res.status(400).json({ 
            success: false,
            message: error.message 
        });
    }
};

/**
 * 프로필 수정
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateProfile = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user.userId,
            { $set: req.body },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다'
            });
        }

        res.json({ success: true, user });
    } catch (error) {
        logger.error('Update profile error:', error);
        res.status(400).json({ 
            success: false,
            message: error.message 
        });
    }
};

// 명시적인 exports
module.exports = {
    registerUser,
    loginUser,
    getProfile,
    updateProfile,
};
