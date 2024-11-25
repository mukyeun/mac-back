const mongoose = require('mongoose');
const logger = require('../utils/logger');

const healthInfoSchema = new mongoose.Schema({
  기본정보: {
    이름: { 
      type: String, 
      required: [true, '이름은 필수입니다'],
      trim: true,
      minlength: [2, '이름은 최소 2자 이상이어야 합니다'],
      maxlength: [50, '이름은 최대 50자까지 가능합니다']
    },
    연락처: { 
      type: String,
      trim: true,
      match: [/^[0-9]{2,3}-[0-9]{3,4}-[0-9]{4}$/, '올바른 전화번호 형식이 아닙니다']
    },
    주민등록번호: { 
      type: String,
      trim: true,
      match: [/^[0-9]{6}-[1-4][0-9]{6}$/, '올바른 주민등록번호 형식이 아닙니다']
    },
    성별: { 
      type: String,
      enum: {
        values: ['남성', '여성'],
        message: '성별은 남성 또는 여성이어야 합니다'
      }
    },
    신장: { 
      type: Number,
      min: [0, '신장은 0cm 이상이어야 합니다'],
      max: [300, '신장은 300cm 이하여야 합니다']
    },
    체중: { 
      type: Number,
      min: [0, '체중은 0kg 이상이어야 합니다'],
      max: [500, '체중은 500kg 이하여야 합니다']
    },
    성격: { 
      type: String,
      enum: {
        values: ['내향적', '외향적', '중간'],
        message: '성격은 내향적, 외향적, 중간 중 하나여야 합니다'
      }
    },
    스트레스: { 
      type: String,
      enum: {
        values: ['낮음', '보통', '높음'],
        message: '스트레스는 낮음, 보통, 높음 중 하나여야 합니다'
      }
    },
    노동강도: { 
      type: String,
      enum: {
        values: ['낮음', '보통', '높음'],
        message: '노동강도는 낮음, 보통, 높음 중 하나여야 합니다'
      }
    }
  },
  맥파분석: {
    수축기혈압: { 
      type: Number,
      min: [0, '수축기혈압은 0mmHg 이상이어야 합니다'],
      max: [300, '수축기혈압은 300mmHg 이하여야 합니다']
    },
    이완기혈압: { 
      type: Number,
      min: [0, '이완기혈압은 0mmHg 이상이어야 합니다'],
      max: [200, '이완기혈압은 200mmHg 이하여야 합니다']
    },
    맥박수: { 
      type: Number,
      min: [0, '맥박수는 0 이상이어야 합니다'],
      max: [300, '맥박수는 300 이하여야 합니다']
    }
  },
  증상선택: {
    증상: [{
      type: String,
      trim: true
    }]
  },
  복용약물: {
    약물: [{
      type: String,
      trim: true
    }],
    기호식품: [{
      type: String,
      trim: true
    }]
  },
  메모: { 
    type: String,
    trim: true,
    maxlength: [1000, '메모는 1000자를 초과할 수 없습니다']
  }
}, {
  timestamps: true,
  versionKey: false
});

// 인덱스 생성
healthInfoSchema.index({ '기본정보.이름': 1 });
healthInfoSchema.index({ '기본정보.연락처': 1 });
healthInfoSchema.index({ createdAt: -1 });

// 가상 필드: BMI 계산
healthInfoSchema.virtual('bmi').get(function() {
  if (this.기본정보.체중 && this.기본정보.신장) {
    const heightInMeters = this.기본정보.신장 / 100;
    return (this.기본정보.체중 / (heightInMeters * heightInMeters)).toFixed(2);
  }
  return null;
});

// 미들웨어: 저장 전 로깅
healthInfoSchema.pre('save', function(next) {
  logger.info('New health info being saved', {
    name: this.기본정보.이름,
    createdAt: new Date()
  });
  next();
});

// 미들웨어: 수정 전 로깅
healthInfoSchema.pre('findOneAndUpdate', function(next) {
  logger.info('Health info being updated', {
    query: this.getQuery()
  });
  next();
});

// 건강 상태 평가 메서드
healthInfoSchema.methods.evaluateHealthStatus = function() {
  return {
    bmi: this.bmi ? {
      value: this.bmi,
      status: this.evaluateBMI()
    } : null,
    bloodPressure: this.맥파분석.수축기혈압 && this.맥파분석.이완기혈압 ? {
      status: this.evaluateBloodPressure()
    } : null,
    pulse: this.맥파분석.맥박수 ? {
      status: this.evaluatePulse()
    } : null
  };
};

// BMI 평가
healthInfoSchema.methods.evaluateBMI = function() {
  const bmi = this.bmi;
  if (!bmi) return null;
  
  if (bmi < 18.5) return '저체중';
  if (bmi < 23) return '정상';
  if (bmi < 25) return '과체중';
  return '비만';
};

// 혈압 평가
healthInfoSchema.methods.evaluateBloodPressure = function() {
  const { 수축기혈압, 이완기혈압 } = this.맥파분석;
  if (!수축기혈압 || !이완기혈압) return null;

  if (수축기혈압 < 120 && 이완기혈압 < 80) return '정상';
  if (수축기혈압 < 130 && 이완기혈압 < 80) return '주의';
  return '고혈압';
};

// 맥박 평가
healthInfoSchema.methods.evaluatePulse = function() {
  const pulse = this.맥파분석.맥박수;
  if (!pulse) return null;

  if (pulse < 60) return '서맥';
  if (pulse <= 100) return '정상';
  return '빈맥';
};

const HealthInfo = mongoose.model('HealthInfo', healthInfoSchema);

module.exports = HealthInfo;