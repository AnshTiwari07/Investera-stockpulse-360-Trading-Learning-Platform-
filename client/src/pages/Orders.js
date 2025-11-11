import React, { useEffect, useState } from 'react';
import api from '../api';

const Orders = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders');
        setOrders(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchOrders();
  }, []);

  return (
    <section className="container" style={{ padding: '2rem 0' }}>
      <h1>Orders</h1>
      <div className="stock-list" style={{ marginTop: '1rem' }}>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Symbol</th>
              <th>Type</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o._id}>
                <td>{new Date(o.executedAt || o.createdAt).toLocaleString()}</td>
                <td>{o.symbol}</td>
                <td>{o.orderType}</td>
                <td>{o.quantity}</td>
                <td>₹ {o.price}</td>
                <td>₹ {o.totalAmount}</td>
                <td>{o.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default Orders;