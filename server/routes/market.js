const express = require('express');
const router = express.Router();
const { getQuote, getOverview, getDailySeries, computePerformance, getRSI, getSMA } = require('../services/marketData');
const { scoreStocks } = require('../services/recoEngine');
const RecommendationLog = require('../models/RecommendationLog');
const InteractionLog = require('../models/InteractionLog');
const auth = require('../middleware/auth');

const DISCLAIMER = 'This is not financial advice. Please do your own research or consult a licensed financial advisor before investing.';

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Quote
router.get('/quote/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const quote = await getQuote(symbol);
    const overview = await getOverview(symbol);
    const daily = await getDailySeries(symbol);
    const perf = computePerformance(daily);
    const rsi = await getRSI(symbol);
    const sma20 = await getSMA(symbol, 'daily', 20);
    const sma50 = await getSMA(symbol, 'daily', 50);
    res.json({
      symbol,
      name: overview.name || symbol,
      quote,
      performance: perf,
      metrics: {
        marketCap: overview.marketCap,
        peRatio: overview.peRatio,
        eps: overview.eps,
        dividendYield: overview.dividendYield,
        sector: overview.sector,
      },
      indicators: {
        rsi: rsi.latest?.value || null,
        sma20: sma20.latest?.value || null,
        sma50: sma50.latest?.value || null,
      },
      disclaimer: DISCLAIMER,
    });
  } catch (e) {
    res.status(500).json({ error: e.message, disclaimer: DISCLAIMER });
  }
});

// Metrics
router.get('/metrics/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const overview = await getOverview(symbol);
    res.json({
      symbol,
      name: overview.name || symbol,
      metrics: {
        marketCap: overview.marketCap,
        peRatio: overview.peRatio,
        eps: overview.eps,
        dividendYield: overview.dividendYield,
        sector: overview.sector,
        analystTargetPrice: overview.analystTargetPrice,
      },
      disclaimer: DISCLAIMER,
    });
  } catch (e) {
    res.status(500).json({ error: e.message, disclaimer: DISCLAIMER });
  }
});

// Indicators
router.get('/indicators/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const rsi = await getRSI(symbol);
    const sma20 = await getSMA(symbol, 'daily', 20);
    const sma50 = await getSMA(symbol, 'daily', 50);
    res.json({
      symbol,
      indicators: {
        rsi: rsi.latest?.value || null,
        sma20: sma20.latest?.value || null,
        sma50: sma50.latest?.value || null,
      },
      disclaimer: DISCLAIMER,
    });
  } catch (e) {
    res.status(500).json({ error: e.message, disclaimer: DISCLAIMER });
  }
});

// Recommendations (requires auth to tie to user, but will work anonymous gracefully)
router.post('/recommendations', auth, async (req, res) => {
  try {
    const { symbols = [], sectors = [], timeHorizon = 'medium', riskTolerance = 'medium' } = req.body || {};

    // If no symbols provided, attempt to use DB stocks by sector or fallback sample
    let evalSymbols = symbols;
    if (!evalSymbols.length) {
      try {
        const Stock = require('../models/Stock');
        const query = sectors.length ? { sector: { $in: sectors } } : {};
        const stocks = await Stock.find(query).limit(25);
        evalSymbols = stocks.map(s => s.symbol);
      } catch (_) {
        evalSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'];
      }
    }

    const scored = await scoreStocks(evalSymbols, { timeHorizon, riskTolerance, sectors });
    const top = scored.filter(s => !s.error).slice(0, 3);

    const response = {
      preferences: { timeHorizon, riskTolerance, sectors },
      suggestions: top.map(s => ({
        ticker: s.symbol,
        company: s.name,
        currentPrice: s.quote?.currentPrice ?? null,
        recentPerformance: s.perf,
        keyMetrics: {
          peRatio: s.overview?.peRatio ?? null,
          eps: s.overview?.eps ?? null,
          dividendYield: s.overview?.dividendYield ?? null,
          marketCap: s.overview?.marketCap ?? null,
        },
        analystSentiment: s.analystSentiment,
        riskAssessment: s.risk,
        score: s.score,
      })),
      disclaimer: DISCLAIMER,
    };

    // log for compliance
    try {
      await RecommendationLog.create({
        userId: req.user?.id || null,
        query: { symbols: evalSymbols, sectors, timeHorizon, riskTolerance },
        symbolsEvaluated: evalSymbols,
        recommendations: response,
        disclaimer: DISCLAIMER,
      });
    } catch (_) {}

    res.json(response);
  } catch (e) {
    console.error('Recommendations error', { message: e.message, stack: e.stack });
    res.status(500).json({ error: e.message, disclaimer: DISCLAIMER });
  }
});

// Conversational interaction logging endpoint
router.post('/interact', auth, async (req, res) => {
  const { intentType = 'general', inputText = '', structuredPrefs = {}, response = {} } = req.body || {};
  try {
    await InteractionLog.create({ userId: req.user?.id || null, intentType, inputText, structuredPrefs, response, disclaimer: DISCLAIMER });
    res.json({ status: 'logged', disclaimer: DISCLAIMER });
  } catch (e) {
    res.status(500).json({ error: e.message, disclaimer: DISCLAIMER });
  }
});

module.exports = router;
