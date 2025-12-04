import React, { useEffect, useState } from 'react';
import api from '../api';
import { 
  Container, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Box,
  Alert
} from '@mui/material';

const Portfolio = () => {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const res = await api.get('/portfolio');
        setPortfolio(res.data);
      } catch (err) {
        console.error('Failed to load portfolio', err);
        setError('Failed to load portfolio. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchPortfolio();
  }, []);
  if (loading) return <div className="shimmer" style={{ height: 40, width: 140, borderRadius: 8 }} />;

  return (
  <Container maxWidth="lg">
    <Typography variant="h4" component="h1" gutterBottom sx={{ color: 'common.white' }}>
      My Portfolio
    </Typography>
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    <Typography variant="h6" gutterBottom sx={{ color: 'common.white' }}>Balance: ₹ {portfolio.balance ?? '—'}</Typography>
      
      <TableContainer component={Paper} className="card-scale-in" sx={{ mt: 3, boxShadow: '0 10px 24px rgba(0,0,0,0.25)', backgroundColor: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(8px)' }}>
        <Table sx={{ '& td': { color: 'common.white' } }}>
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 600 } }}>
              <TableCell sx={{ color: 'common.white' }}>Symbol</TableCell>
              <TableCell sx={{ color: 'common.white' }}>Qty</TableCell>
              <TableCell sx={{ color: 'common.white' }}>Avg Price</TableCell>
              <TableCell sx={{ color: 'common.white' }}>Invested</TableCell>
              <TableCell sx={{ color: 'common.white' }}>Current</TableCell>
              <TableCell sx={{ color: 'common.white' }}>P/L</TableCell>
              <TableCell sx={{ color: 'common.white' }}>P/L %</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(!portfolio.holdings || portfolio.holdings.length === 0) && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ color: 'common.white' }}>
                  No holdings yet. Place orders to build your portfolio.
                </TableCell>
              </TableRow>
            )}
            {portfolio.holdings?.map((h) => (
              <TableRow key={h.symbol} hover className="hover-raise">
                <TableCell>{h.symbol}</TableCell>
                <TableCell>{h.quantity}</TableCell>
                <TableCell>₹ {h.averageBuyPrice}</TableCell>
                <TableCell>₹ {h.investedAmount}</TableCell>
                <TableCell>₹ {h.currentValue}</TableCell>
                <TableCell sx={{ color: h.profitLoss >= 0 ? 'success.main' : 'error.main' }}>₹ {h.profitLoss}</TableCell>
                <TableCell sx={{ color: h.profitLossPercentage >= 0 ? 'success.main' : 'error.main' }}>{h.profitLossPercentage}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Paper className="card-scale-in" sx={{ p: 2, mt: 3, boxShadow: '0 10px 24px rgba(0,0,0,0.25)', backgroundColor: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(8px)' }}>
        <Typography sx={{ color: 'common.white' }}>Total Invested: ₹ {portfolio.totalInvestment}</Typography>
        <Typography sx={{ color: 'common.white' }}>Current Value: ₹ {portfolio.currentValue}</Typography>
        <Typography sx={{ color: 'common.white' }}>Overall P/L: <Box component="span" sx={{ color: portfolio.overallProfitLoss >= 0 ? 'success.main' : 'error.main' }}>₹ {portfolio.overallProfitLoss} ({portfolio.overallProfitLossPercentage}%)</Box></Typography>
        <Typography sx={{ mt: 1, color: 'common.white' }}>Realized P/L: <Box component="span" sx={{ color: (portfolio.realizedProfitLoss || 0) >= 0 ? 'success.main' : 'error.main' }}>₹ {portfolio.realizedProfitLoss ?? 0}</Box></Typography>
      </Paper>
    </Container>
  );
};

export default Portfolio;
