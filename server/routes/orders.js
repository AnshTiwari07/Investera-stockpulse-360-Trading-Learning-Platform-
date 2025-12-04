const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Stock = require('../models/Stock');
const Portfolio = require('../models/Portfolio');
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const { getLatestPrice } = require('../services/pricing');

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

    console.log('[ORDERS] Place request:', { symbol, quantity, orderType, price });

    if (!symbol || !quantity || !orderType) {
      return res.status(400).json({ msg: 'Missing required fields' });
    }

    const q = Number(quantity);
    if (q <= 0) return res.status(400).json({ msg: 'Quantity must be positive' });

    const stock = await Stock.findOne({ symbol: symbol.toUpperCase() });
    if (!stock) return res.status(404).json({ msg: 'Stock not found' });

    // Use explicit price if provided; otherwise fetch latest to avoid stale equality
    const priceSource = price ? 'explicit' : 'pricing_service';
    const executionPrice = price ? Number(price) : await getLatestPrice(stock.symbol);
    const totalAmount = Number((executionPrice * q).toFixed(2));
    console.log('[ORDERS] Computed executionPrice and totalAmount:', { executionPrice, totalAmount, priceSource });

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
      // Mark remaining quantity for FIFO pairing
      var remainingQtyForOrder = q;
    } else if (orderType === 'SELL') {
      if (holdingIndex === -1 || portfolio.holdings[holdingIndex].quantity < q) {
        return res.status(400).json({ msg: 'Not enough quantity to sell' });
      }

      const h = portfolio.holdings[holdingIndex];
      // Allocate sell quantity across FIFO BUY orders and record transactions
      let remainingToSell = q;
      let realizedFromThisSell = 0;
      const buyOrders = await Order.find({
        user: req.user.id,
        symbol: stock.symbol,
        orderType: 'BUY',
        status: 'COMPLETED'
      }).sort({ createdAt: 1 });

      for (const bo of buyOrders) {
        const available = typeof bo.remainingQuantity === 'number' ? bo.remainingQuantity : bo.quantity;
        if (available <= 0) continue;
        if (remainingToSell <= 0) break;
        const alloc = Math.min(available, remainingToSell);

        // Validation: positive numeric values
        if (alloc <= 0 || executionPrice <= 0 || bo.price <= 0) {
          return res.status(400).json({ msg: 'Invalid numeric values for transaction' });
        }

        // Chronological validation: sell date must be >= buy date
        const sellDate = new Date();
        if (sellDate < bo.createdAt) {
          return res.status(400).json({ msg: 'Sell date must be after buy date' });
        }

        // Prevent implicit reuse: if no explicit price and exec equals buy price, refresh once
        let effectiveSellPrice = executionPrice;
        if (!price && Number(effectiveSellPrice.toFixed(2)) === Number(bo.price.toFixed(2))) {
          effectiveSellPrice = await getLatestPrice(stock.symbol);
          console.log('[ORDERS] Refreshed sell price to avoid stale equality:', {
            symbol: stock.symbol,
            previousSellPrice: executionPrice,
            refreshedSellPrice: effectiveSellPrice,
          });
        }

        const buyAmount = Number((bo.price * alloc).toFixed(2));
        const sellAmount = Number((effectiveSellPrice * alloc).toFixed(2));
        const pl = Number((sellAmount - buyAmount).toFixed(2));
        const classification = pl > 0 ? 'PROFIT' : pl < 0 ? 'LOSS' : 'BREAKEVEN';

        const txn = new Transaction({
          user: req.user.id,
          symbol: stock.symbol,
          buyPrice: bo.price,
          buyQuantity: alloc,
          buyAmount,
          buyDate: bo.executedAt || bo.createdAt,
          sellPrice: effectiveSellPrice,
          sellQuantity: alloc,
          sellAmount,
          sellDate,
          profitLoss: pl,
          classification
        });
        await txn.save();

        console.log('[ORDERS] FIFO allocation ->', {
          symbol: stock.symbol,
          alloc,
          buyPrice: bo.price,
          sellPrice: effectiveSellPrice,
          buyAmount,
          sellAmount,
          profitLoss: pl,
          classification,
        });

        bo.remainingQuantity = Number((available - alloc).toFixed(0));
        await bo.save();

        realizedFromThisSell = Number((realizedFromThisSell + pl).toFixed(2));
        remainingToSell -= alloc;
      }

      // If we couldn't allocate full sell against buys, fail
      if (remainingToSell > 0) {
        return res.status(400).json({ msg: 'Selling quantity exceeds purchased quantity (FIFO allocation failed)' });
      }

      portfolio.realizedProfitLoss = Number(((portfolio.realizedProfitLoss || 0) + realizedFromThisSell).toFixed(2));
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

    // Set remainingQuantity for BUY orders
    if (orderType === 'BUY') {
      order.remainingQuantity = remainingQtyForOrder;
    }

    await order.save();
    await user.save();
    await portfolio.save();

    console.log('[ORDERS] Order executed:', {
      id: order._id.toString(),
      symbol: order.symbol,
      orderType: order.orderType,
      quantity: order.quantity,
      price: order.price,
      totalAmount: order.totalAmount,
    });

    res.json({ msg: 'Order executed', order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
