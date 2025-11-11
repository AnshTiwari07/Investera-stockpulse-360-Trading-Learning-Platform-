const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Stock = require('../models/Stock');
const Portfolio = require('../models/Portfolio');
const Order = require('../models/Order');

// GET /api/orders - list current user's orders
router.get('/', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/orders/place - place buy/sell order
router.post('/place', auth, async (req, res) => {
  try {
    const { symbol, quantity, orderType, price } = req.body;

    if (!symbol || !quantity || !orderType) {
      return res.status(400).json({ msg: 'Missing required fields' });
    }

    const q = Number(quantity);
    if (q <= 0) return res.status(400).json({ msg: 'Quantity must be positive' });

    const stock = await Stock.findOne({ symbol: symbol.toUpperCase() });
    if (!stock) return res.status(404).json({ msg: 'Stock not found' });

    const executionPrice = price ? Number(price) : stock.currentPrice;
    const totalAmount = Number((executionPrice * q).toFixed(2));

    const user = await User.findById(req.user.id);
    let portfolio = await Portfolio.findOne({ user: req.user.id });
    if (!portfolio) {
      portfolio = new Portfolio({ user: req.user.id, holdings: [] });
      await portfolio.save();
    }

    const holdingIndex = portfolio.holdings.findIndex((h) => h.symbol === stock.symbol);

    if (orderType === 'BUY') {
      if (user.balance < totalAmount) {
        return res.status(400).json({ msg: 'Insufficient balance' });
      }

      user.balance = Number((user.balance - totalAmount).toFixed(2));

      if (holdingIndex === -1) {
        portfolio.holdings.push({
          stock: stock._id,
          symbol: stock.symbol,
          quantity: q,
          averageBuyPrice: executionPrice,
        });
      } else {
        const h = portfolio.holdings[holdingIndex];
        const newQty = h.quantity + q;
        const newAvg = Number(((h.averageBuyPrice * h.quantity + executionPrice * q) / newQty).toFixed(2));
        h.quantity = newQty;
        h.averageBuyPrice = newAvg;
      }
    } else if (orderType === 'SELL') {
      if (holdingIndex === -1 || portfolio.holdings[holdingIndex].quantity < q) {
        return res.status(400).json({ msg: 'Not enough quantity to sell' });
      }

      const h = portfolio.holdings[holdingIndex];
      h.quantity -= q;
      user.balance = Number((user.balance + totalAmount).toFixed(2));

      if (h.quantity === 0) {
        portfolio.holdings.splice(holdingIndex, 1);
      }
    } else {
      return res.status(400).json({ msg: 'Invalid orderType' });
    }

    const order = new Order({
      user: user._id,
      stock: stock._id,
      symbol: stock.symbol,
      orderType,
      quantity: q,
      price: executionPrice,
      status: 'COMPLETED',
      totalAmount,
      executedAt: new Date()
    });

    await order.save();
    await user.save();
    await portfolio.save();

    res.json({ msg: 'Order executed', order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;