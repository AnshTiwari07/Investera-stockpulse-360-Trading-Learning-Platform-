const mongoose = require('mongoose');

const PortfolioSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  holdings: [
    {
      stock: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stock',
        required: true
      },
      symbol: {
        type: String,
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        default: 0
      },
      averageBuyPrice: {
        type: Number,
        required: true
      },
      investedAmount: {
        type: Number
      },
      currentValue: {
        type: Number
      },
      profitLoss: {
        type: Number
      },
      profitLossPercentage: {
        type: Number
      }
    }
  ],
  totalInvestment: {
    type: Number,
    default: 0
  },
  currentValue: {
    type: Number,
    default: 0
  },
  overallProfitLoss: {
    type: Number,
    default: 0
  },
  overallProfitLossPercentage: {
    type: Number,
    default: 0
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Portfolio', PortfolioSchema);