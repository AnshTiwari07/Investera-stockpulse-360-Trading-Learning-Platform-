import React, { useEffect, useState, useRef } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import api from '../api';
import Sparkline from '../components/Sparkline';
import MarketOverviewVisuals from '../components/MarketOverviewVisuals';
import { 
  Container, 
  Typography, 
  Button, 
  Box, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  CircularProgress, 
  Alert 
} from '@mui/material';

const Dashboard = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [notice, setNotice] = useState(null);
  const [sparklineData, setSparklineData] = useState({});
  const controllersRef = useRef([]);
  const historyCacheRef = useRef(new Map()); // cache history by symbol+range
  const [connStatus, setConnStatus] = useState('disconnected'); // disconnected | connecting | connected | stale
  const lastUpdateRef = useRef(new Map());
  const sseRef = useRef(null);

  const fetchStocks = async (retry = false) => {
    setLoading(true);
    try {
      const res = await api.get('/stocks');
      const list = Array.isArray(res.data) ? res.data : (res.data?.stocks || []);
      setStocks(list);
      await fetchSparklineData(list);
      setError(null);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load stocks', err);
      if (!retry) {
        setTimeout(() => fetchStocks(true), 650);
        return;
      }
      setError('Failed to load market data. Please try again.');
      setLoading(false);
    }
  };

  const fetchSparklineData = async (stocksToFetch) => {
    const data = {};
    // Process sequentially to reduce simultaneous in-flight requests and aborted logs
    for (const stock of stocksToFetch) {
      const cacheKey = `${stock.symbol}|7D`;
      const cached = historyCacheRef.current.get(cacheKey);
      if (cached) {
        data[stock.symbol] = cached;
        continue;
      }
      const controller = new AbortController();
      controllersRef.current.push(controller);
      try {
        const res = await api.get(`/stocks/${stock.symbol}/history?range=7D`, { signal: controller.signal });
        // Handle different response formats
        let series = [];
        if (res.data && res.data.history) {
          series = res.data.history;
        } else if (res.data && Array.isArray(res.data)) {
          series = res.data;
        } else {
          console.warn(`No history data for ${stock.symbol}`);
        }
        data[stock.symbol] = series;
        // Cache successful result to prevent refetch churn
        historyCacheRef.current.set(cacheKey, series);
      } catch (err) {
        // Gracefully ignore cancellations
        if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') {
          data[stock.symbol] = [];
        } else {
          console.error(`Failed to fetch sparkline for ${stock.symbol}`, err);
          data[stock.symbol] = [];
        }
      }
    }
    setSparklineData(data);
  }

  useEffect(() => {
    fetchStocks();
    // Abort any inflight sparkline requests on unmount to prevent aborted network errors
    return () => {
      controllersRef.current.forEach((c) => {
        try { c.abort(); } catch (_) {}
      });
      controllersRef.current = [];
      historyCacheRef.current.clear();
    };
  }, []);

  // Subscribe to server-sent events for real-time price updates
  useEffect(() => {
    if (!stocks || stocks.length === 0) return;
    // Close previous stream if any
    if (sseRef.current) {
      try { sseRef.current.close(); } catch (_) {}
      sseRef.current = null;
    }
    const symbols = stocks.map(s => s.symbol).join(',');
    setConnStatus('connecting');
    const streamUrl = `${process.env.REACT_APP_API_BASE || 'http://localhost:5000/api'}/stream/prices?symbols=${encodeURIComponent(symbols)}`;
    const es = new EventSource(streamUrl);
    sseRef.current = es;
    es.onopen = () => setConnStatus('connected');
    es.onerror = () => setConnStatus('stale');
    es.onmessage = (evt) => {
      try {
        const payload = JSON.parse(evt.data);
        const now = Date.now();
        // Update stocks and sparkline from server snapshots
        setStocks((prev) => prev.map((s) => {
          const snap = payload[s.symbol];
          if (!snap || typeof snap.price !== 'number') return s;
          const newPrice = Number(Number(snap.price).toFixed(2));
          const change = Number(Number(snap.change || 0).toFixed(2));
          const changePercent = Number(Number(snap.changePercent || 0).toFixed(2));
          lastUpdateRef.current.set(s.symbol, now);
          return { ...s, currentPrice: newPrice, change, changePercent, volume: snap.volume || s.volume, lastUpdate: snap.timestamp };
        }));

        setSparklineData((prevSpark) => {
          const next = { ...prevSpark };
          Object.entries(payload).forEach(([sym, snap]) => {
            if (!snap || typeof snap.price !== 'number') return;
            const series = Array.isArray(next[sym]) ? next[sym] : [];
            const appended = [...series, { close: Number(Number(snap.price).toFixed(2)) }];
            next[sym] = appended.length > 180 ? appended.slice(-180) : appended;
          });
          return next;
        });
        setConnStatus('connected');
      } catch (_) {
        setConnStatus('stale');
      }
    };

    return () => {
      try { es.close(); } catch (_) {}
      sseRef.current = null;
    };
  }, [stocks]);

  const handleSeed = async () => {
    try {
      setSeeding(true);
      setNotice(null);
      await api.post('/stocks/seed');
      setNotice({ type: 'success', msg: 'Seeded demo stocks' });
      setLoading(true);
      await fetchStocks();
    } catch (err) {
      console.error(err);
      setNotice({ type: 'error', msg: 'Seeding failed' });
    } finally {
      setSeeding(false);
    }
  };

  if (loading) return <div className="shimmer" style={{ height: 40, width: 160, borderRadius: 8 }} />;

  return (
    <Container maxWidth="lg">
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ color: 'common.white', textAlign: 'center' }}>
          Market Overview
        </Typography>
        <Box sx={{ mt: 1 }}>
          <Button variant="outlined" onClick={handleSeed} disabled={seeding} sx={{ mr: 1 }}>
            {seeding ? 'Seeding...' : 'Seed Demo Data'}
          </Button>
          <Button variant="contained" component={RouterLink} to="/portfolio">Go to Portfolio</Button>
        </Box>
      </Box>
      {notice && <Alert severity={notice.type} sx={{ mb: 2 }}>{notice.msg}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Visual enhancements: hero, infographics, interactive chart */}
      <MarketOverviewVisuals stocks={stocks} sparklineData={sparklineData} />

      <TableContainer component={Paper} className="card-scale-in" sx={{ boxShadow: '0 10px 24px rgba(0,0,0,0.25)', backgroundColor: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(8px)' }}>
        <Table sx={{ '& td': { color: 'common.white' } }}>
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 600 } }}>
              <TableCell sx={{ color: 'common.white' }}>Symbol</TableCell>
              <TableCell sx={{ color: 'common.white' }}>Name</TableCell>
              <TableCell sx={{ color: 'common.white' }}>Price</TableCell>
              <TableCell sx={{ color: 'common.white' }}>Change</TableCell>
              <TableCell sx={{ color: 'common.white' }}>Change %</TableCell>
              <TableCell sx={{ color: 'common.white' }}>Volume</TableCell>
              <TableCell sx={{ color: 'common.white' }}>Last Update</TableCell>
              <TableCell sx={{ color: 'common.white' }}>7D Chart</TableCell>
              <TableCell sx={{ color: 'common.white' }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stocks.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ color: 'common.white' }}>
                  No stocks available. Use "Seed Demo Data" to populate.
                </TableCell>
              </TableRow>
            )}
            {stocks.map((s) => (
              <TableRow key={s.symbol} hover className="hover-raise">
                <TableCell>{s.symbol}</TableCell>
                <TableCell>{s.name}</TableCell>
                <TableCell>₹ {s.currentPrice}</TableCell>
                <TableCell sx={{ color: s.change >= 0 ? 'success.main' : 'error.main' }}>{s.change}</TableCell>
              <TableCell sx={{ color: s.changePercent >= 0 ? 'success.main' : 'error.main' }}>
                {s.changePercent}%
                <span style={{ marginLeft: 8, color: '#9ca3af', fontSize: '0.75rem' }}>(valid: 10–80%)</span>
              </TableCell>
                <TableCell>{s.volume ?? '—'}</TableCell>
                <TableCell>
                  {s.lastUpdate ? new Date(s.lastUpdate).toLocaleTimeString() : '—'}
                  {(() => {
                    const last = lastUpdateRef.current.get(s.symbol) || 0;
                    const stale = Date.now() - last > 2000;
                    return <span style={{ marginLeft: 8, fontSize: '0.75rem', color: stale ? '#ff6b6b' : '#4caf50' }}>{stale ? 'stale' : 'live'}</span>;
                  })()}
                </TableCell>
                <TableCell style={{ width: 150 }}>
                  <Box sx={{ border: '3px solid black', mt: '3px', mb: '3px', position: 'relative', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {sparklineData[s.symbol] ? (
                        <Sparkline 
                          data={sparklineData[s.symbol]} 
                          dataKey="close"
                          strokeColor={s.change >= 0 ? '#4caf50' : '#f44336'}
                        />
                      ) : (
                        <div className="shimmer" style={{ height: 40 }} />
                      )}
                    <Typography variant="caption" sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'common.white', fontWeight: 700, pointerEvents: 'none' }}>
                      7D Chart
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Button variant="contained" size="small" component={RouterLink} to={`/stock/${s.symbol}`}>View</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {/* Connection status indicator */}
      <Box sx={{ mt: 2, textAlign: 'right' }}>
        <Typography variant="caption" sx={{ color: connStatus === 'connected' ? 'success.main' : (connStatus === 'stale' ? 'warning.main' : 'error.main') }}>
          Stream: {connStatus}
        </Typography>
      </Box>
    </Container>
  );
};

export default Dashboard;
