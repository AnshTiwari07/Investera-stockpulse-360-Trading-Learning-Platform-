const { getQuote, getOverview, getDailySeries, computePerformance, getRSI, getSMA } = require('./marketData');

// Normalize and score stocks using multi-factor approach
// inputs: symbols array, preferences { timeHorizon, riskTolerance, sectors }
async function scoreStocks(symbols = [], preferences = {}) {
  const results = [];
  for (const symbol of symbols) {
    try {
      const [quote, overview, series, rsi, sma20, sma50] = await Promise.all([
        getQuote(symbol),
        getOverview(symbol),
        getDailySeries(symbol),
        getRSI(symbol, 'daily', 14),
        getSMA(symbol, 'daily', 20),
        getSMA(symbol, 'daily', 50),
      ]);

      const perf = computePerformance(series);
      const rsiVal = rsi.latest?.value || null;
      const sma20Val = sma20.latest?.value || null;
      const sma50Val = sma50.latest?.value || null;

      // factor scores (0..1), simple heuristics
      const perfScore = normalizePerf(perf, preferences.timeHorizon);
      const valuationScore = overview.peRatio ? clamp((30 - overview.peRatio) / 30, 0, 1) : 0.5; // lower PE better
      const dividendScore = overview.dividendYield ? clamp(overview.dividendYield / 5, 0, 1) : 0; // capped at 5%
      const rsiScore = rsiVal ? (rsiVal >= 30 && rsiVal <= 70 ? 1 : clamp(1 - Math.abs(rsiVal - 50) / 50, 0, 1)) : 0.5;
      const trendScore = (sma20Val && sma50Val && quote.currentPrice)
        ? clamp(((quote.currentPrice - sma50Val) / sma50Val + (sma20Val - sma50Val) / sma50Val) / 2, -1, 1) * 0.5 + 0.5
        : 0.5;

      // simple analyst sentiment proxy using performance + RSI balance
      const sentimentScore = clamp((perfScore + rsiScore + trendScore) / 3, 0, 1);

      // combine with weights adjusted by riskTolerance
      const wt = weightsForRisk(preferences.riskTolerance);
      const totalScore = (
        perfScore * wt.perf +
        trendScore * wt.trend +
        valuationScore * wt.valuation +
        dividendScore * wt.dividend +
        rsiScore * wt.rsi +
        sentimentScore * wt.sentiment
      );

      results.push({
        symbol,
        name: overview.name || symbol,
        score: Number(totalScore.toFixed(3)),
        perf,
        quote,
        overview,
        technicals: { rsi: rsiVal, sma20: sma20Val, sma50: sma50Val },
        analystSentiment: summarizeSentiment(sentimentScore),
        risk: assessRisk(overview, perf, rsiVal),
      });
    } catch (e) {
      results.push({ symbol, error: e.message });
    }
  }

  // sort by score desc
  results.sort((a, b) => (b.score || 0) - (a.score || 0));
  return results;
}

function normalizePerf(perf, horizon = 'medium') {
  if (!perf || typeof perf['1M'] !== 'number') return 0.5;
  const h = horizon || 'medium';
  const targets = {
    short: perf['1M'],
    medium: (perf['3M'] + perf['6M']) / 2,
    long: perf['1Y'],
  };
  const val = targets[h] ?? targets['medium'];
  // New mapping: 10%..80% -> 0..1, clamp outside range
  const minPct = 10;
  const maxPct = 80;
  const clamped = Math.max(minPct, Math.min(maxPct, val));
  const score = (clamped - minPct) / (maxPct - minPct);
  return clamp(score, 0, 1);
}

function weightsForRisk(risk = 'medium') {
  const base = { perf: 0.25, trend: 0.2, valuation: 0.2, dividend: 0.1, rsi: 0.15, sentiment: 0.1 };
  if (risk === 'low') return { ...base, dividend: 0.2, valuation: 0.25, perf: 0.2 };
  if (risk === 'high') return { ...base, perf: 0.35, trend: 0.25, valuation: 0.1, dividend: 0.05 };
  return base;
}

function summarizeSentiment(score) {
  if (score >= 0.75) return { label: 'Positive', summary: 'Momentum and trend are supportive; sentiment appears constructive.' };
  if (score >= 0.5) return { label: 'Neutral', summary: 'Mixed signals; watch trend/RSI and upcoming catalysts.' };
  return { label: 'Cautious', summary: 'Signals are weak/overbought; consider waiting for confirmation.' };
}

function assessRisk(overview, perf, rsi) {
  const risks = [];
  if (overview.peRatio && overview.peRatio > 30) risks.push('Valuation stretched vs long-term averages');
  if (rsi && (rsi > 70 || rsi < 30)) risks.push('RSI indicates potential overbought/oversold conditions');
  if (perf && perf['1M'] && Math.abs(perf['1M']) > 15) risks.push('High short-term volatility');
  return risks.length ? risks : ['Standard market and liquidity risks'];
}

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

module.exports = { scoreStocks };
