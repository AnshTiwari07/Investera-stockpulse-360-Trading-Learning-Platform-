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
  Alert
} from '@mui/material';

const Orders = () => {
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders');
        setOrders(res.data);
      } catch (err) {
        if (err.response && err.response.status === 401) {
          setError('Please log in to view your orders.');
        } else {
          setError('Failed to load orders');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) return <div className="shimmer" style={{ height: 40, width: 120, borderRadius: 8 }} />;

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom sx={{ color: 'common.white' }}>
        Orders
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <TableContainer component={Paper} className="card-scale-in" sx={{ boxShadow: '0 10px 24px rgba(0,0,0,0.25)', backgroundColor: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(8px)' }}>
        <Table sx={{ '& td': { color: 'common.white' } }}>
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 600 } }}>
              <TableCell sx={{ color: 'common.white' }}>Time</TableCell>
              <TableCell sx={{ color: 'common.white' }}>Symbol</TableCell>
              <TableCell sx={{ color: 'common.white' }}>Type</TableCell>
              <TableCell sx={{ color: 'common.white' }}>Qty</TableCell>
              <TableCell sx={{ color: 'common.white' }}>Price</TableCell>
              <TableCell sx={{ color: 'common.white' }}>Total</TableCell>
              <TableCell sx={{ color: 'common.white' }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((o) => (
              <TableRow key={o._id} hover className="hover-raise">
                <TableCell>{new Date(o.executedAt || o.createdAt).toLocaleString()}</TableCell>
                <TableCell>{o.symbol}</TableCell>
                <TableCell>{o.orderType}</TableCell>
                <TableCell>{o.quantity}</TableCell>
                <TableCell>₹ {o.price}</TableCell>
                <TableCell>₹ {o.totalAmount}</TableCell>
                <TableCell>{o.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default Orders;