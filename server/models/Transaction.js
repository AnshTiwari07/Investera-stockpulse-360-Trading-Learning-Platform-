const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  symbol: {
    type: String,
    required: true
  },
  buyPrice: {
    type: Number,
    required: true
  },
  buyQuantity: {
    type: Number,
    required: true
  },
  buyAmount: {
    type: Number,
    required: true
  },
  buyDate: {
    type: Date,
    required: true
  },
  sellPrice: {
    type: Number,
    required: true
  },
  sellQuantity: {
    type: Number,
    required: true
  },
  sellAmount: {
    type: Number,
    required: true
  },
  sellDate: {
    type: Date,
    required: true
  },
  profitLoss: {
    type: Number,
    required: true
  },
  classification: {
    type: String,
    enum: ['PROFIT', 'LOSS', 'BREAKEVEN'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Transaction', TransactionSchema);
