const mongoose = require('mongoose');

const PriceTickSchema = new mongoose.Schema({
  symbol: { type: String, required: true, index: true },
  price: { type: Number, required: true },
  change: { type: Number, default: 0 },
  changePercent: { type: Number, default: 0 },
  volume: { type: Number, default: 0 },
  source: { type: String, default: 'aggregator' },
  receivedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('PriceTick', PriceTickSchema);

