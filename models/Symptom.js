const mongoose = require('mongoose');

const symptomSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  severity: { type: Number, min: 1, max: 10 },
  date: { type: Date, default: Date.now },
  duration: String,
  notes: String
});

module.exports = mongoose.model('Symptom', symptomSchema);
