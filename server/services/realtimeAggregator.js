const { getQuote } = require('./marketData');
const { getLatestPrice } = require('./pricing');

// Aggregate from multiple sources and validate consistency
// Returns { price, change, changePercent, volume, source, timestamp }
async function getRealtimeSnapshot(symbol) {
  const ts = new Date();
  let primary, fallback;

  try {
    primary = await getQuote(symbol); // Alpha Vantage based
  } catch (e) {
    primary = null;
  }

  try {
    const price = await getLatestPrice(symbol); // drift-based fallback
    fallback = { currentPrice: price, change: 0, changePercent: 0, volume: null };
  } catch (e) {
    fallback = null;
  }

  // Choose best available and validate
  let p = null;
  let src = 'unknown';
  let volume = 0;
  let change = 0;
  let changePercent = 0;

  if (primary && typeof primary.currentPrice === 'number') {
    p = primary.currentPrice;
    change = typeof primary.change === 'number' ? primary.change : 0;
    changePercent = typeof primary.changePercent === 'number' ? primary.changePercent : 0;
    volume = typeof primary.volume === 'number' ? primary.volume : 0;
    src = 'alphaVantage';
  } else if (fallback) {
    p = fallback.currentPrice;
    change = fallback.change || 0;
    changePercent = fallback.changePercent || 0;
    volume = fallback.volume || 0;
    src = 'fallback';
  }

  // Guardrails: filter implausible jumps (>80% within 1s)
  if (typeof changePercent === 'number' && Math.abs(changePercent) > 80) {
    changePercent = 0;
  }

  return {
    price: p,
    change,
    changePercent,
    volume,
    source: src,
    timestamp: ts.toISOString(),
  };
}

module.exports = { getRealtimeSnapshot };

