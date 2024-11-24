const mongoose = require('mongoose');

const healthInfoSchema = new mongoose.Schema({
  기본정보: {
    이름: { type: String, required: true },
    연락처: { type: String },
    주민등록번호: { type: String },
    성별: { type: String },
    신장: { type: Number },
    체중: { type: Number },
    성격: { type: String },
    스트레스: { type: String },
    노동강도: { type: String }
  },
  맥파분석: {
    수축기혈압: { type: Number },
    이완기혈압: { type: Number },
    맥박수: { type: Number }
  },
  증상선택: {
    증상: [{ type: String }]
  },
  복용약물: {
    약물: [{ type: String }],
    기호식품: [{ type: String }]
  },
  메모: { type: String }
}, {
  timestamps: true
});

module.exports = mongoose.model('HealthInfo', healthInfoSchema);