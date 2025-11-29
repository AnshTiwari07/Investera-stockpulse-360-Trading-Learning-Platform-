const express = require('express');
const router = express.Router();
const Stock = require('../models/Stock');
const auth = require('../middleware/auth');

// GET /api/stocks - list all stocks (public)
router.get('/', async (req, res) => {
  try {
    const stocks = await Stock.find({}).sort({ symbol: 1 });
    res.json(stocks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET /api/stocks/:symbol - get stock by symbol (public)
router.get('/:symbol', async (req, res) => {
  try {
    const stock = await Stock.findOne({ symbol: req.params.symbol.toUpperCase() });
    if (!stock) return res.status(404).json({ msg: 'Stock not found' });
    res.json(stock);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// DEV: POST /api/stocks/seed - seed some demo stocks
router.post('/seed', async (req, res) => {
  try {
    const demo = [
      { symbol: 'RELIANCE', name: 'Reliance Industries', currentPrice: 2450, previousClose: 2430, high: 2475, low: 2410, volume: 3100000, marketCap: 16500000000000, sector: 'Conglomerate', logo: 'reliance.png', startDate: '1973', owner: 'Mukesh Ambani', growth: 2.5 },
      { symbol: 'TCS', name: 'Tata Consultancy Services', currentPrice: 3800, previousClose: 3775, high: 3850, low: 3750, volume: 1200000, marketCap: 14000000000000, sector: 'IT Services', logo: 'tcs.png', startDate: '1968', owner: 'Tata Group', growth: 3.1 },
      { symbol: 'INFY', name: 'Infosys', currentPrice: 1540, previousClose: 1520, high: 1555, low: 1510, volume: 2100000, marketCap: 6500000000000, sector: 'IT Services', logo: 'infosys.png', startDate: '1981', owner: 'Narayana Murthy', growth: 1.8 },
      { symbol: 'HDFCBANK', name: 'HDFC Bank', currentPrice: 1580, previousClose: 1570, high: 1600, low: 1560, volume: 2500000, marketCap: 9200000000000, sector: 'Banking', logo: 'hdfc.png', startDate: '1994', owner: 'HDFC', growth: 4.2 },
      { symbol: 'SBIN', name: 'State Bank of India', currentPrice: 615, previousClose: 600, high: 620, low: 595, volume: 5000000, marketCap: 5500000000000, sector: 'Banking', logo: 'sbi.png', startDate: '1955', owner: 'Government of India', growth: 0.9 },
      { symbol: 'ASIANPAINT', name: 'Asian Paints', currentPrice: 3100, previousClose: 3050, high: 3125, low: 3040, volume: 500000, marketCap: 2970000000000, sector: 'Chemicals' },
      { symbol: 'BAJFINANCE', name: 'Bajaj Finance', currentPrice: 7200, previousClose: 7150, high: 7250, low: 7100, volume: 800000, marketCap: 4400000000000, sector: 'Financial Services' },
      { symbol: 'BHARTIARTL', name: 'Bharti Airtel', currentPrice: 800, previousClose: 790, high: 810, low: 785, volume: 4000000, marketCap: 4500000000000, sector: 'Telecommunication' },
      { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', currentPrice: 2700, previousClose: 2680, high: 2720, low: 2670, volume: 1000000, marketCap: 6300000000000, sector: 'FMCG' },
      { symbol: 'ICICIBANK', name: 'ICICI Bank', currentPrice: 950, previousClose: 940, high: 960, low: 935, volume: 6000000, marketCap: 6600000000000, sector: 'Banking' },
      { symbol: 'ITC', name: 'ITC Limited', currentPrice: 450, previousClose: 445, high: 455, low: 440, volume: 12000000, marketCap: 5600000000000, sector: 'Conglomerate' },
      { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', currentPrice: 1900, previousClose: 1880, high: 1920, low: 1870, volume: 1500000, marketCap: 3800000000000, sector: 'Banking' },
      { symbol: 'LT', name: 'Larsen & Toubro', currentPrice: 2400, previousClose: 2380, high: 2420, low: 2370, volume: 900000, marketCap: 3400000000000, sector: 'Infrastructure' },
      { symbol: 'MARUTI', name: 'Maruti Suzuki India', currentPrice: 9500, previousClose: 9450, high: 9550, low: 9400, volume: 300000, marketCap: 2800000000000, sector: 'Automobile' },
      { symbol: 'NESTLEIND', name: 'Nestle India', currentPrice: 22000, previousClose: 21800, high: 22200, low: 21700, volume: 50000, marketCap: 2100000000000, sector: 'FMCG' },
      { symbol: 'NTPC', name: 'NTPC Limited', currentPrice: 180, previousClose: 178, high: 182, low: 177, volume: 15000000, marketCap: 1700000000000, sector: 'Power' },
      { symbol: 'ONGC', name: 'Oil & Natural Gas Corporation', currentPrice: 160, previousClose: 158, high: 162, low: 157, volume: 10000000, marketCap: 2000000000000, sector: 'Oil & Gas' },
      { symbol: 'POWERGRID', name: 'Power Grid Corporation of India', currentPrice: 240, previousClose: 238, high: 242, low: 237, volume: 8000000, marketCap: 1600000000000, sector: 'Power' },
      { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical Industries', currentPrice: 1000, previousClose: 990, high: 1010, low: 985, volume: 2000000, marketCap: 2400000000000, sector: 'Pharmaceuticals' },
      { symbol: 'TATAMOTORS', name: 'Tata Motors', currentPrice: 620, previousClose: 610, high: 630, low: 605, volume: 10000000, marketCap: 2100000000000, sector: 'Automobile' },
      { symbol: 'TATASTEEL', name: 'Tata Steel', currentPrice: 120, previousClose: 118, high: 122, low: 117, volume: 40000000, marketCap: 1400000000000, sector: 'Steel' },
      { symbol: 'TECHM', name: 'Tech Mahindra', currentPrice: 1200, previousClose: 1180, high: 1220, low: 1170, volume: 1500000, marketCap: 1200000000000, sector: 'IT Services' },
      { symbol: 'TITAN', name: 'Titan Company', currentPrice: 3200, previousClose: 3150, high: 3250, low: 3140, volume: 600000, marketCap: 2800000000000, sector: 'Lifestyle' },
      { symbol: 'ULTRACEMCO', name: 'UltraTech Cement', currentPrice: 8200, previousClose: 8100, high: 8300, low: 8050, volume: 200000, marketCap: 2300000000000, sector: 'Cement' },
      { symbol: 'WIPRO', name: 'Wipro', currentPrice: 400, previousClose: 395, high: 405, low: 390, volume: 5000000, marketCap: 2200000000000, sector: 'IT Services' },
      { symbol: 'ADANIENT', name: 'Adani Enterprises', currentPrice: 2500, previousClose: 2480, high: 2520, low: 2470, volume: 2000000, marketCap: 2800000000000, sector: 'Conglomerate' },
      { symbol: 'ADANIPORTS', name: 'Adani Ports & SEZ', currentPrice: 750, previousClose: 740, high: 760, low: 735, volume: 3000000, marketCap: 1600000000000, sector: 'Infrastructure' },
      { symbol: 'APOLLOHOSP', name: 'Apollo Hospitals Enterprise', currentPrice: 5000, previousClose: 4950, high: 5050, low: 4900, volume: 400000, marketCap: 710000000000, sector: 'Healthcare' },
      { symbol: 'AXISBANK', name: 'Axis Bank', currentPrice: 980, previousClose: 970, high: 990, low: 965, volume: 5000000, marketCap: 3000000000000, sector: 'Banking' },
      { symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto', currentPrice: 4800, previousClose: 4750, high: 4850, low: 4700, volume: 300000, marketCap: 1300000000000, sector: 'Automobile' },
      { symbol: 'BAJFINSERV', name: 'Bajaj Finserv', currentPrice: 1500, previousClose: 1480, high: 1520, low: 1470, volume: 1000000, marketCap: 2400000000000, sector: 'Financial Services' },
      { symbol: 'BPCL', name: 'Bharat Petroleum Corporation', currentPrice: 360, previousClose: 355, high: 365, low: 350, volume: 6000000, marketCap: 780000000000, sector: 'Oil & Gas' },
      { symbol: 'BRITANNIA', name: 'Britannia Industries', currentPrice: 4600, previousClose: 4550, high: 4650, low: 4500, volume: 200000, marketCap: 1100000000000, sector: 'FMCG' },
      { symbol: 'CIPLA', name: 'Cipla', currentPrice: 1200, previousClose: 1180, high: 1220, low: 1170, volume: 1000000, marketCap: 960000000000, sector: 'Pharmaceuticals' },
      { symbol: 'COALINDIA', name: 'Coal India', currentPrice: 230, previousClose: 228, high: 232, low: 227, volume: 10000000, marketCap: 1400000000000, sector: 'Mining' },
      { symbol: 'DIVISLAB', name: "Divi's Laboratories", currentPrice: 3500, previousClose: 3450, high: 3550, low: 3400, volume: 500000, marketCap: 930000000000, sector: 'Pharmaceuticals' },
      { symbol: 'DRREDDY', name: "Dr. Reddy's Laboratories", currentPrice: 5200, previousClose: 5150, high: 5250, low: 5100, volume: 300000, marketCap: 870000000000, sector: 'Pharmaceuticals' },
      { symbol: 'EICHERMOT', name: 'Eicher Motors', currentPrice: 3400, previousClose: 3350, high: 3450, low: 3300, volume: 400000, marketCap: 930000000000, sector: 'Automobile' },
      { symbol: 'GRASIM', name: 'Grasim Industries', currentPrice: 1800, previousClose: 1780, high: 1820, low: 1770, volume: 800000, marketCap: 1200000000000, sector: 'Materials' },
      { symbol: 'HCLTECH', name: 'HCL Technologies', currentPrice: 1100, previousClose: 1090, high: 1110, low: 1080, volume: 2000000, marketCap: 3000000000000, sector: 'IT Services' },
      { symbol: 'HDFCLIFE', name: 'HDFC Life Insurance Company', currentPrice: 650, previousClose: 640, high: 660, low: 635, volume: 3000000, marketCap: 1400000000000, sector: 'Insurance' },
      { symbol: 'HEROMOTOCO', name: 'Hero MotoCorp', currentPrice: 2900, previousClose: 2850, high: 2950, low: 2840, volume: 500000, marketCap: 580000000000, sector: 'Automobile' },
      { symbol: 'HINDALCO', name: 'Hindalco Industries', currentPrice: 450, previousClose: 440, high: 460, low: 435, volume: 8000000, marketCap: 1000000000000, sector: 'Metals' },
      { symbol: 'INDUSINDBK', name: 'IndusInd Bank', currentPrice: 1300, previousClose: 1480, high: 1320, low: 1270, volume: 2000000, marketCap: 1000000000000, sector: 'Banking' },
      { symbol: 'JSWSTEEL', name: 'JSW Steel', currentPrice: 750, previousClose: 740, high: 760, low: 735, volume: 5000000, marketCap: 1800000000000, sector: 'Steel' },
      { symbol: 'M&M', name: 'Mahindra & Mahindra', currentPrice: 1400, previousClose: 1380, high: 1420, low: 1370, volume: 2000000, marketCap: 1700000000000, sector: 'Automobile' },
      { symbol: 'RELIANCE', name: 'Reliance Industries', currentPrice: 2450, previousClose: 2430, high: 2475, low: 2410, volume: 3100000, marketCap: 16500000000000, sector: 'Conglomerate' },
      { symbol: 'TCS', name: 'Tata Consultancy Services', currentPrice: 3800, previousClose: 3775, high: 3850, low: 3750, volume: 1200000, marketCap: 14000000000000, sector: 'IT Services' },
      { symbol: 'INFY', name: 'Infosys', currentPrice: 1540, previousClose: 1520, high: 1555, low: 1510, volume: 2100000, marketCap: 6500000000000, sector: 'IT Services' },
      { symbol: 'AXISBANK', name: 'AXIS Bank', currentPrice: 1580, previousClose: 1570, high: 1600, low: 1560, volume: 2500000, marketCap: 9200000000000, sector: 'Banking' },
      { symbol: 'NVIDIA CORPORATION', name: 'NVIDIA CORPORATION', currentPrice: 615, previousClose: 600, high: 620, low: 595, volume: 5000000, marketCap: 5500000000000, sector: 'AI Services' }
    ];

    for (const s of demo) {
      const change = s.currentPrice - s.previousClose;
      s.change = change;
      s.changePercent = Number(((change / s.previousClose) * 100).toFixed(2));
      // Ensure every seeded stock has a logo; fall back to a generic placeholder
      if (!s.logo) s.logo = 'investara.png';
    }

    await Stock.bulkWrite(
      demo.map((doc) => ({
        updateOne: {
          filter: { symbol: doc.symbol },
          update: { $set: doc },
          upsert: true
        }
      }))
    );

    res.json({ msg: 'Seeded demo stocks' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET /api/stocks/:symbol/history - get historical price data (public)
router.get('/:symbol/history', async (req, res) => {
  try {
    const { range = '1M' } = req.query;
    let days = 30;
    if (range === '7D') days = 7;
    if (range === '3M') days = 90;

    // Generate mock historical data
    const data = [];
    const today = new Date();
    
    // Get the current stock price to work backwards from
    const stock = await Stock.findOne({ symbol: req.params.symbol.toUpperCase() });
    if (!stock) return res.status(404).json({ msg: 'Stock not found' });
    
    let lastPrice = stock.currentPrice;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Add some random price movement
      const change = (Math.random() - 0.5) * (lastPrice * 0.05); // Max 5% daily change
      const open = lastPrice;
      const close = Math.max(0.1, lastPrice + change);
      const high = Math.max(open, close) + Math.random() * (open * 0.02);
      const low = Math.min(open, close) - Math.random() * (open * 0.02);
      
      data.push({
        date: date.toISOString().split('T')[0],
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume: Math.floor(Math.random() * 1000000) + 100000
      });
      
      lastPrice = close;
    }
    
    res.json({ symbol: stock.symbol, history: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET /api/stocks/:symbol/predict - get simple price prediction
router.get('/:symbol/predict', auth, async (req, res) => {
  try {
    // Get the historical data first
    const stock = await Stock.findOne({ symbol: req.params.symbol.toUpperCase() });
    if (!stock) return res.status(404).json({ msg: 'Stock not found' });
    
    // Generate 30 days of mock historical data for prediction
    const days = 30;
    const data = [];
    const today = new Date();
    
    let lastPrice = stock.currentPrice;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const change = (Math.random() - 0.5) * (lastPrice * 0.05);
      const close = Math.max(0.1, lastPrice + change);
      
      data.push({
        date: date.toISOString().split('T')[0],
        close: Number(close.toFixed(2))
      });
      
      lastPrice = close;
    }
    
    // Simple prediction: calculate the average change over the last 7 days
    const recentData = data.slice(-7);
    const changes = [];
    for (let i = 1; i < recentData.length; i++) {
      changes.push(recentData[i].close - recentData[i - 1].close);
    }
    
    const avgChange = changes.reduce((sum, change) => sum + change, 0) / changes.length;
    const predictedPrice = stock.currentPrice + avgChange;
    
    // Calculate confidence based on volatility (standard deviation of changes)
    const variance = changes.reduce((sum, change) => sum + Math.pow(change - avgChange, 2), 0) / changes.length;
    const volatility = Math.sqrt(variance);
    const confidence = Math.max(0, Math.min(100, 100 - (volatility / stock.currentPrice * 100)));
    
    res.json({
      symbol: stock.symbol,
      currentPrice: stock.currentPrice,
      predictedPrice: Number(predictedPrice.toFixed(2)),
      predictedChange: Number((predictedPrice - stock.currentPrice).toFixed(2)),
      predictedChangePercent: Number(((predictedPrice - stock.currentPrice) / stock.currentPrice * 100).toFixed(2)),
      confidence: Number(confidence.toFixed(1))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});



module.exports = router;
