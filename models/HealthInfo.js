const mongoose = require('mongoose');

const healthInfoSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  weight: {
    type: Number,
    min: 0,
    max: 500
  },
  height: {
    type: Number,
    min: 0,
    max: 300
  },
  bloodPressure: {
    systolic: {
      type: Number,
      min: 0,
      max: 300
    },
    diastolic: {
      type: Number,
      min: 0,
      max: 200
    }
  },
  bloodSugar: {
    type: Number,
    min: 0,
    max: 1000
  },
  steps: {
    type: Number,
    min: 0
  },
  sleepHours: {
    type: Number,
    min: 0,
    max: 24
  },
  note: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// 사용자별 날짜 unique 인덱스
healthInfoSchema.index({ userId: 1, date: 1 }, { unique: true });

const HealthInfo = mongoose.model('HealthInfo', healthInfoSchema);

module.exports = HealthInfo;