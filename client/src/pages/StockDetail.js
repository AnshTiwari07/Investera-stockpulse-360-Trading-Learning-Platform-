import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import axios from 'axios';
import StockChart from '../components/StockChart';

const imageMap = {
  'reliance.png': require('../images/reliance.png'),
  'tcs.png': require('../images/tcs.png'),
  'infosys.png': require('../images/infosys.png'),
  'hdfc.png': require('../images/hdfc.png'),
  'sbi.png': require('../images/sbi.png'),
  'zerodha.png': require('../images/zerodha.png'),
};

const StockDetail = () => {
  const { symbol } = useParams();
  const [stock, setStock] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState(null);
  const [history, setHistory] = useState([]);
  const [showChart, setShowChart] = useState(false);

  const fetchStock = async () => {
    try {
      const res = await api.get(`/stocks/${symbol}`);
      setStock(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`/api/stocks/${symbol}/history?range=1M`);
      setHistory(res.data.history);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { 
    fetchStock();
    fetchHistory();
  }, [symbol]);

  const placeOrder = async (orderType) => {
    try {
      const res = await api.post('/orders/place', { symbol, quantity, orderType });
      setMessage(res.data.msg);
    } catch (err) {
      setMessage('Order failed');
    }
  };

  if (!stock) return <div className="loading">Loading stock...</div>;

  return (
    <section className="container" style={{ padding: '2rem 0' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img src={imageMap[stock.logo]} alt={`${stock.name} logo`} style={{ width: '100px', height: '100px', marginRight: '2rem' }} />
        <div>
          <h1>{stock.name} ({stock.symbol})</h1>
          <p>Price: ₹ {stock.currentPrice}</p>
          <p>Prev Close: ₹ {stock.previousClose} | High: ₹ {stock.high} | Low: ₹ {stock.low}</p>
          <p>Change: <span className={stock.change >= 0 ? 'positive' : 'negative'}>{stock.change}</span> ({stock.changePercent}%)</p>
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <button className="btn btn-light" onClick={() => setShowChart(!showChart)}>
          {showChart ? 'Hide Chart' : 'View Chart'}
        </button>
        {showChart && history && history.length > 0 && <StockChart data={history} />}
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2>Company Information</h2>
        <p>
          {stock.name}, a prominent player in the {stock.sector} sector, is led by {stock.owner}. 
          Established in {stock.startDate}, the company has grown to a market capitalization of ₹{stock.marketCap}. 
          With a consistent growth rate of {stock.growth}%, the company continues to be a strong performer in the market. 
          Investors are closely watching its performance as it continues to innovate and expand its market reach.
        </p>
      </div>

      <div className="form" style={{ marginTop: '2rem', display: 'flex', alignItems: 'center' }}>
        <div className="form-group" style={{ marginRight: '1rem' }}>
          <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} style={{ width: '100px', padding: '0.5rem' }} />
        </div>
        <button style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '0.5rem 1rem', marginRight: '0.5rem', cursor: 'pointer' }} onClick={() => placeOrder('BUY')}>
          Buy
        </button>
        <button style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer' }} onClick={() => placeOrder('SELL')}>
          Sell
        </button>
      </div>

      {message && <p className="form-text" style={{ marginTop: '1rem' }}>{message}</p>}
    </section>
  );
};

export default StockDetail;