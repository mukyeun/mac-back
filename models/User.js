const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: [true, '사용자 이름은 필수입니다'],
    unique: true,
    trim: true,
    minlength: [3, '사용자 이름은 최소 3자 이상이어야 합니다'],
    maxlength: [20, '사용자 이름은 최대 20자까지 가능합니다']
  },
  email: { 
    type: String, 
    required: [true, '이메일은 필수입니다'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      '유효한 이메일 주소를 입력해주세요'
    ]
  },
  password: { 
    type: String, 
    required: [true, '비밀번호는 필수입니다'],
    minlength: [6, '비밀번호는 최소 6자 이상이어야 합니다'],
    select: false
  },
  name: { 
    type: String, 
    required: [true, '이름은 필수입니다'],
    trim: true,
    minlength: [2, '이름은 최소 2자 이상이어야 합니다'],
    maxlength: [50, '이름은 최대 50자까지 가능합니다']
  },
  role: {
    type: String,
    enum: {
      values: ['user', 'admin'],
      message: '역할은 user 또는 admin이어야 합니다'
    },
    default: 'user'
  },
  lastLogin: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  versionKey: false
});

// 인덱스 생성
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });

// 비밀번호 해싱 미들웨어
userSchema.pre('save', async function(next) {
  try {
    if (!this.isModified('password')) {
      return next();
    }
    
    const salt = await bcrypt.genSalt(8);
    this.password = await bcrypt.hash(this.password, salt);
    
    logger.info('User password hashed', {
      userId: this._id,
      username: this.username
    });
    
    next();
  } catch (error) {
    logger.error('Password hashing error:', error);
    next(error);
  }
});

// 비밀번호 비교 메서드
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    // password가 select: false로 설정되어 있으므로, 명시적으로 password 필드를 선택
    const user = await this.constructor.findById(this._id).select('+password');
    return await bcrypt.compare(candidatePassword, user.password);
  } catch (error) {
    logger.error('Password comparison error:', error);
    throw error;
  }
};

// 로그인 시간 업데이트 메서드
userSchema.methods.updateLastLogin = async function() {
  try {
    this.lastLogin = new Date();
    await this.save();
    
    logger.info('User last login updated', {
      userId: this._id,
      username: this.username,
      lastLogin: this.lastLogin
    });
  } catch (error) {
    logger.error('Update last login error:', error);
    throw error;
  }
};

const User = mongoose.model('User', userSchema);

module.exports = User;