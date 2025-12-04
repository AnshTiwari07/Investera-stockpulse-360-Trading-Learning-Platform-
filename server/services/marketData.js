const axios = require('axios');

// Simple in-memory cache with TTL per key
const cache = new Map();

function setCache(key, data, ttlMs) {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

function getCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

const ALPHA_BASE = 'https://www.alphavantage.co/query';
const API_KEY = process.env.ALPHA_VANTAGE_KEY;

async function alphaRequest(params) {
  if (!API_KEY) {
    throw new Error('Missing ALPHA_VANTAGE_KEY in environment');
  }
  const url = `${ALPHA_BASE}`;
  const res = await axios.get(url, { params: { ...params, apikey: API_KEY } });
  return res.data;
}

// Fetch realtime quote
async function getQuote(symbol) {
  const cacheKey = `quote:${symbol}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const data = await alphaRequest({ function: 'GLOBAL_QUOTE', symbol });
  const q = data && data['Global Quote'] ? data['Global Quote'] : {};
  const normalized = {
    symbol,
    currentPrice: parseFloat(q['05. price']) || null,
    previousClose: parseFloat(q['08. previous close']) || null,
    change: parseFloat(q['09. change']) || null,
    // Accept decimals; if present and outside the 10–80 range, keep raw but flag for downstream clamping
    changePercent: parseFloat((q['10. change percent'] || '').replace('%', '')) || null,
    high: parseFloat(q['03. high']) || null,
    low: parseFloat(q['04. low']) || null,
    volume: parseInt(q['06. volume']) || null,
    latestTradingDay: q['07. latest trading day'] || null,
    fetchedAt: new Date().toISOString(),
  };
  setCache(cacheKey, normalized, 1000 * 60 * 2); // 2 minutes
  return normalized;
}

// Fetch company overview fundamentals
async function getOverview(symbol) {
  const cacheKey = `overview:${symbol}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;
  const raw = await alphaRequest({ function: 'OVERVIEW', symbol });
  const normalized = {
    symbol,
    name: raw.Name || symbol,
    marketCap: raw.MarketCapitalization ? Number(raw.MarketCapitalization) : null,
    peRatio: raw.PERatio ? Number(raw.PERatio) : null,
    eps: raw.EPS ? Number(raw.EPS) : null,
    dividendYield: raw.DividendYield ? Number(raw.DividendYield) : null,
    sector: raw.Sector || null,
    analystTargetPrice: raw.AnalystTargetPrice ? Number(raw.AnalystTargetPrice) : null,
    profitability: raw.OperatingMarginTTM ? Number(raw.OperatingMarginTTM) : null,
    updatedAt: new Date().toISOString(),
  };
  setCache(cacheKey, normalized, 1000 * 60 * 60 * 12); // 12 hours
  return normalized;
}

// Fetch daily series for performance calculations
async function getDailySeries(symbol) {
  const cacheKey = `daily:${symbol}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;
  const raw = await alphaRequest({ function: 'TIME_SERIES_DAILY_ADJUSTED', symbol, outputsize: 'compact' });
  const series = raw['Time Series (Daily)'] || {};
  const points = Object.entries(series)
    .map(([date, vals]) => ({ date, close: Number(vals['4. close']) }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  setCache(cacheKey, points, 1000 * 60 * 15); // 15 minutes
  return points;
}

// Compute performance returns over windows
function computePerformance(points) {
  const byDate = points;
  if (byDate.length < 2) return {};
  const latest = byDate[byDate.length - 1];
  const pickCloseForDaysAgo = (days) => {
    const targetDate = new Date(latest.date);
    targetDate.setDate(targetDate.getDate() - days);
    // pick the first point whose date <= targetDate
    for (let i = byDate.length - 1; i >= 0; i--) {
      const d = new Date(byDate[i].date);
      if (d <= targetDate) return byDate[i].close;
    }
    return byDate[0].close;
  };
  const ret = (pastClose) => ((latest.close - pastClose) / pastClose) * 100;
  return {
    '1M': ret(pickCloseForDaysAgo(30)),
    '3M': ret(pickCloseForDaysAgo(90)),
    '6M': ret(pickCloseForDaysAgo(180)),
    '1Y': ret(pickCloseForDaysAgo(365)),
    latestClose: latest.close,
    latestDate: latest.date,
  };
}

// Technical indicators: RSI and SMA
async function getRSI(symbol, interval = 'daily', time_period = 14) {
  const cacheKey = `rsi:${symbol}:${interval}:${time_period}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;
  const raw = await alphaRequest({ function: 'RSI', symbol, interval, time_period, series_type: 'close' });
  const data = raw['Technical Analysis: RSI'] || {};
  const entries = Object.entries(data)
    .map(([date, vals]) => ({ date, value: Number(vals['RSI']) }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const latest = entries.length ? entries[entries.length - 1] : null;
  const result = { latest, series: entries };
  setCache(cacheKey, result, 1000 * 60 * 30); // 30 minutes
  return result;
}

async function getSMA(symbol, interval = 'daily', time_period = 20) {
  const cacheKey = `sma:${symbol}:${interval}:${time_period}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;
  const raw = await alphaRequest({ function: 'SMA', symbol, interval, time_period, series_type: 'close' });
  const data = raw['Technical Analysis: SMA'] || {};
  const entries = Object.entries(data)
    .map(([date, vals]) => ({ date, value: Number(vals['SMA']) }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const latest = entries.length ? entries[entries.length - 1] : null;
  const result = { latest, series: entries };
  setCache(cacheKey, result, 1000 * 60 * 30); // 30 minutes
  return result;
}

module.exports = {
  getQuote,
  getOverview,
  getDailySeries,
  computePerformance,
  getRSI,
  getSMA,
};
