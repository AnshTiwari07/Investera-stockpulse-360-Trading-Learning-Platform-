const mongoose = require('mongoose');

const InteractionLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  intentType: { type: String, enum: ['general', 'specific', 'portfolio'], required: true },
  inputText: { type: String, required: true },
  structuredPrefs: { type: Object },
  response: { type: Object },
  disclaimer: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('InteractionLog', InteractionLogSchema);

