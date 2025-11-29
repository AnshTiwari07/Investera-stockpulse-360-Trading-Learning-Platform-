import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import api from '../api';
import Sparkline from '../components/Sparkline';
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
  const [seeding, setSeeding] = useState(false);
  const [notice, setNotice] = useState(null);
  const [sparklineData, setSparklineData] = useState({});

  const fetchStocks = async () => {
    try {
      const res = await api.get('/stocks');
      setStocks(res.data);
      fetchSparklineData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSparklineData = async (stocksToFetch) => {
    const data = {};
    for (const stock of stocksToFetch) {
      try {
        const res = await api.get(`/stocks/${stock.symbol}/history?range=7D`);
        // Handle different response formats
        if (res.data && res.data.history) {
          data[stock.symbol] = res.data.history;
        } else if (res.data && Array.isArray(res.data)) {
          data[stock.symbol] = res.data;
        } else {
          console.warn(`No history data for ${stock.symbol}`);
          data[stock.symbol] = [];
        }
      } catch (err) {
        console.error(`Failed to fetch sparkline for ${stock.symbol}`, err);
        data[stock.symbol] = [];
      }
    }
    setSparklineData(data);
  }

  useEffect(() => {
    fetchStocks();
  }, []);

  // Live per-second price updates and sparkline appends
  useEffect(() => {
    if (!stocks || stocks.length === 0) return;
    const interval = setInterval(() => {
      setStocks((prevStocks) => {
        const updated = prevStocks.map((s) => {
          const volatility = 0.003; // ~0.3% per second max swing
          const delta = (Math.random() - 0.5) * (s.currentPrice * volatility);
          const newPrice = Math.max(0.1, Number((s.currentPrice + delta).toFixed(2)));
          const change = Number((newPrice - (s.previousClose || newPrice)).toFixed(2));
          const changePercent = s.previousClose
            ? Number(((change / s.previousClose) * 100).toFixed(2))
            : 0;
          return { ...s, currentPrice: newPrice, change, changePercent };
        });

        // Append into sparkline series based on updated prices
        setSparklineData((prevSpark) => {
          const next = { ...prevSpark };
          updated.forEach((s) => {
            const series = Array.isArray(next[s.symbol]) ? next[s.symbol] : [];
            const point = { close: s.currentPrice };
            const appended = [...series, point];
            // keep last 120 points (~2 minutes of 1s ticks)
            next[s.symbol] = appended.length > 120 ? appended.slice(-120) : appended;
          });
          return next;
        });

        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
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

      <TableContainer component={Paper} className="card-scale-in" sx={{ boxShadow: '0 10px 24px rgba(0,0,0,0.25)', backgroundColor: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(8px)' }}>
        <Table sx={{ '& td': { color: 'common.white' } }}>
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 600 } }}>
              <TableCell sx={{ color: 'common.white' }}>Symbol</TableCell>
              <TableCell sx={{ color: 'common.white' }}>Name</TableCell>
              <TableCell sx={{ color: 'common.white' }}>Price</TableCell>
              <TableCell sx={{ color: 'common.white' }}>Change</TableCell>
              <TableCell sx={{ color: 'common.white' }}>Change %</TableCell>
              <TableCell sx={{ color: 'common.white' }}>7D Chart</TableCell>
              <TableCell sx={{ color: 'common.white' }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stocks.map((s) => (
              <TableRow key={s.symbol} hover className="hover-raise">
                <TableCell>{s.symbol}</TableCell>
                <TableCell>{s.name}</TableCell>
                <TableCell>₹ {s.currentPrice}</TableCell>
                <TableCell sx={{ color: s.change >= 0 ? 'success.main' : 'error.main' }}>{s.change}</TableCell>
                <TableCell sx={{ color: s.changePercent >= 0 ? 'success.main' : 'error.main' }}>{s.changePercent}%</TableCell>
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
    </Container>
  );
};

export default Dashboard;