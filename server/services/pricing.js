const Stock = require('../models/Stock');

// Simple drift-based pricing service to avoid stale equal buy/sell prices
// NOTE: In production, replace with a real market data provider.
async function getLatestPrice(symbol) {
  const stock = await Stock.findOne({ symbol });
  if (!stock) {
    throw new Error(`Stock not found for symbol ${symbol}`);
  }

  // If updated recently, keep price; else apply a small random drift
  const now = Date.now();
  const last = stock.updatedAt ? new Date(stock.updatedAt).getTime() : now - 60000;
  const minutes = Math.max(0, (now - last) / 60000);

  // Drift magnitude proportional to time elapsed, capped
  const base = stock.currentPrice || stock.previousClose || 100;
  const volatility = Math.min(0.02, 0.002 * minutes); // up to 2%
  const drift = base * volatility * (Math.random() * 2 - 1); // +/- volatility
  const newPrice = Math.max(0.01, Number((base + drift).toFixed(2))); // prevent non-positive

  stock.currentPrice = newPrice;
  stock.updatedAt = new Date();
  await stock.save();

  return newPrice;
}

module.exports = {
  getLatestPrice,
};

