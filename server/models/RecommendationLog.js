const mongoose = require('mongoose');

const RecommendationLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  query: { type: Object, required: true },
  symbolsEvaluated: { type: [String], default: [] },
  recommendations: { type: Object, required: true },
  disclaimer: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('RecommendationLog', RecommendationLogSchema);

