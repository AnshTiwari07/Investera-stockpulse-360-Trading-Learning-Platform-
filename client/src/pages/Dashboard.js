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

  if (loading) return <CircularProgress />;

  return (
    <Container maxWidth="lg">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Market Overview
        </Typography>
        <Box>
          <Button variant="outlined" onClick={handleSeed} disabled={seeding} sx={{ mr: 1 }}>
            {seeding ? 'Seeding...' : 'Seed Demo Data'}
          </Button>
          <Button variant="contained" component={RouterLink} to="/portfolio">Go to Portfolio</Button>
        </Box>
      </Box>
      {notice && <Alert severity={notice.type} sx={{ mb: 2 }}>{notice.msg}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Symbol</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Change</TableCell>
              <TableCell>Change %</TableCell>
              <TableCell>7D Chart</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stocks.map((s) => (
              <TableRow key={s.symbol} hover>
                <TableCell>{s.symbol}</TableCell>
                <TableCell>{s.name}</TableCell>
                <TableCell>₹ {s.currentPrice}</TableCell>
                <TableCell sx={{ color: s.change >= 0 ? 'success.main' : 'error.main' }}>{s.change}</TableCell>
                <TableCell sx={{ color: s.changePercent >= 0 ? 'success.main' : 'error.main' }}>{s.changePercent}%</TableCell>
                <TableCell style={{ width: 150 }}>
                  {sparklineData[s.symbol] ? (
                      <Sparkline 
                        data={sparklineData[s.symbol]} 
                        dataKey="close"
                        strokeColor={s.change >= 0 ? '#4caf50' : '#f44336'}
                      />
                    ) : (
                      <div style={{ height: 40, display: 'flex', alignItems: 'center' }}>Loading...</div>
                    )}
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