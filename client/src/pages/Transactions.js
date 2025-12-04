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
  Alert,
  Box
} from '@mui/material';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await api.get('/transactions');
        setTransactions(res.data.transactions || []);
        setSummary(res.data.summary || null);
      } catch (err) {
        if (err.response && err.response.status === 401) {
          setError('Please log in to view your transactions.');
        } else {
          setError('Failed to load transactions');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  if (loading) return <div className="shimmer" style={{ height: 40, width: 160, borderRadius: 8 }} />;

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom sx={{ color: 'common.white' }}>
        Transactions
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {summary && (
        <Paper className="card-scale-in" sx={{ p: 2, mb: 3, boxShadow: '0 10px 24px rgba(0,0,0,0.25)', backgroundColor: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(8px)' }}>
          <Typography sx={{ color: 'common.white' }}>Total Profit: <Box component="span" sx={{ color: 'success.main' }}>₹ {summary.totalProfit}</Box></Typography>
          <Typography sx={{ color: 'common.white' }}>Total Loss: <Box component="span" sx={{ color: 'error.main' }}>₹ {summary.totalLoss}</Box></Typography>
          <Typography sx={{ color: 'common.white' }}>Net P/L: <Box component="span" sx={{ color: summary.netProfitLoss >= 0 ? 'success.main' : 'error.main' }}>₹ {summary.netProfitLoss}</Box></Typography>
          <Typography sx={{ color: 'common.white' }}>Total Investment: ₹ {summary.totalInvestment}</Typography>
          <Typography sx={{ color: 'common.white' }}>Gain/Loss %: {summary.percentageGainLoss}%</Typography>
        </Paper>
      )}

      <TableContainer component={Paper} className="card-scale-in" sx={{ boxShadow: '0 10px 24px rgba(0,0,0,0.25)', backgroundColor: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(8px)' }}>
        <Table sx={{ '& td': { color: 'common.white' } }}>
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 600 } }}>
              <TableCell sx={{ color: 'common.white' }}>Symbol</TableCell>
              <TableCell sx={{ color: 'common.white' }}>Buy Price</TableCell>
              <TableCell sx={{ color: 'common.white' }}>Buy Qty</TableCell>
              <TableCell sx={{ color: 'common.white' }}>Buy Amount</TableCell>
              <TableCell sx={{ color: 'common.white' }}>Buy Date</TableCell>
              <TableCell sx={{ color: 'common.white' }}>Sell Price</TableCell>
              <TableCell sx={{ color: 'common.white' }}>Sell Qty</TableCell>
              <TableCell sx={{ color: 'common.white' }}>Sell Amount</TableCell>
              <TableCell sx={{ color: 'common.white' }}>Sell Date</TableCell>
              <TableCell sx={{ color: 'common.white' }}>P/L</TableCell>
              <TableCell sx={{ color: 'common.white' }}>Class</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.length === 0 && (
              <TableRow>
                <TableCell colSpan={11} align="center" sx={{ color: 'common.white' }}>
                  No transactions yet. Execute buy/sell orders to record P/L.
                </TableCell>
              </TableRow>
            )}
            {transactions.map((t) => (
              <TableRow key={t._id} hover className="hover-raise">
                <TableCell>{t.symbol}</TableCell>
                <TableCell>₹ {t.buyPrice}</TableCell>
                <TableCell>{t.buyQuantity}</TableCell>
                <TableCell>₹ {t.buyAmount}</TableCell>
                <TableCell>{new Date(t.buyDate).toLocaleString()}</TableCell>
                <TableCell>₹ {t.sellPrice}</TableCell>
                <TableCell>{t.sellQuantity}</TableCell>
                <TableCell>₹ {t.sellAmount}</TableCell>
                <TableCell>{new Date(t.sellDate).toLocaleString()}</TableCell>
                <TableCell sx={{ color: t.profitLoss >= 0 ? 'success.main' : 'error.main' }}>₹ {t.profitLoss}</TableCell>
                <TableCell>{t.classification}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default Transactions;
