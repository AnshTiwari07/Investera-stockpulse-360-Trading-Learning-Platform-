const express = require('express');
const router = express.Router();
const PriceTick = require('../models/PriceTick');
const { getRealtimeSnapshot } = require('../services/realtimeAggregator');

// Server-Sent Events for real-time price updates
router.get('/prices', async (req, res) => {
  try {
    const symbolsParam = req.query.symbols || '';
    const symbols = symbolsParam.split(',').map(s => s.trim()).filter(Boolean);

    if (symbols.length === 0) {
      return res.status(400).json({ error: 'symbols query param required' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    let alive = true;
    req.on('close', () => { alive = false; });

    async function pushOnce() {
      const payload = {};
      for (const sym of symbols) {
        try {
          const snap = await getRealtimeSnapshot(sym);
          if (snap && typeof snap.price === 'number') {
            payload[sym] = snap;
            // Store tick for audit
            const tick = new PriceTick({
              symbol: sym,
              price: snap.price,
              change: snap.change,
              changePercent: snap.changePercent,
              volume: snap.volume || 0,
              source: snap.source,
              receivedAt: new Date(snap.timestamp),
            });
            tick.save().catch(() => {});
          }
        } catch (e) {
          // Emit error per-symbol
          payload[sym] = { error: 'fetch_failed', timestamp: new Date().toISOString() };
        }
      }
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    }

    // Initial push
    pushOnce();
    const interval = setInterval(() => {
      if (!alive) {
        clearInterval(interval);
        return;
      }
      pushOnce();
    }, 1000);
  } catch (err) {
    res.status(500).json({ error: 'stream_init_failed' });
  }
});

module.exports = router;

