const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Transaction = require('../models/Transaction');

// GET /api/transactions - list user's transactions and summary
router.get('/', auth, async (req, res) => {
  try {
    const txns = await Transaction.find({ user: req.user.id }).sort({ createdAt: -1 });

    let totalProfit = 0;
    let totalLoss = 0;
    let totalInvestment = 0;

    for (const t of txns) {
      totalInvestment += t.buyAmount;
      if (t.profitLoss > 0) totalProfit += t.profitLoss;
      else if (t.profitLoss < 0) totalLoss += Math.abs(t.profitLoss);
    }

    const net = Number((totalProfit - totalLoss).toFixed(2));
    const pct = totalInvestment > 0 ? Number(((net / totalInvestment) * 100).toFixed(2)) : 0;

    res.json({
      transactions: txns,
      summary: {
        totalProfit: Number(totalProfit.toFixed(2)),
        totalLoss: Number(totalLoss.toFixed(2)),
        netProfitLoss: net,
        totalInvestment: Number(totalInvestment.toFixed(2)),
        percentageGainLoss: pct
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
