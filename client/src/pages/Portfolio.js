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
  CircularProgress, 
  Box 
} from '@mui/material';

const Portfolio = () => {
  const [portfolio, setPortfolio] = useState(null);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const res = await api.get('/portfolio');
        setPortfolio(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPortfolio();
  }, []);

  if (!portfolio) return <CircularProgress />;

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        My Portfolio
      </Typography>
      <Typography variant="h6" gutterBottom>Balance: ₹ {portfolio.balance ?? '—'}</Typography>
      
      <TableContainer component={Paper} sx={{ mt: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Symbol</TableCell>
              <TableCell>Qty</TableCell>
              <TableCell>Avg Price</TableCell>
              <TableCell>Invested</TableCell>
              <TableCell>Current</TableCell>
              <TableCell>P/L</TableCell>
              <TableCell>P/L %</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {portfolio.holdings.map((h) => (
              <TableRow key={h.symbol} hover>
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

      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography>Total Invested: ₹ {portfolio.totalInvestment}</Typography>
        <Typography>Current Value: ₹ {portfolio.currentValue}</Typography>
        <Typography>Overall P/L: <Box component="span" sx={{ color: portfolio.overallProfitLoss >= 0 ? 'success.main' : 'error.main' }}>₹ {portfolio.overallProfitLoss} ({portfolio.overallProfitLossPercentage}%)</Box></Typography>
      </Paper>
    </Container>
  );
};

export default Portfolio;