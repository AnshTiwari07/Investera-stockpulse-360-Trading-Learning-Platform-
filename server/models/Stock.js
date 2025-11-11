const mongoose = require('mongoose');

const StockSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  currentPrice: {
    type: Number,
    required: true
  },
  previousClose: {
    type: Number
  },
  change: {
    type: Number
  },
  changePercent: {
    type: Number
  },
  high: {
    type: Number
  },
  low: {
    type: Number
  },
  volume: {
    type: Number
  },
  marketCap: {
    type: Number
  },
  sector: {
    type: String
  },
  logo: {
    type: String
  },
  startDate: {
    type: String
  },
  owner: {
    type: String
  },
  growth: {
    type: Number
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Stock', StockSchema);