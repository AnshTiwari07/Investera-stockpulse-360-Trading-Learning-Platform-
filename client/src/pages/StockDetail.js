import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import axios from 'axios';
import StockChart from '../components/StockChart';
import LiveChart from '../components/LiveChart';

const imageMap = {
  'reliance.png': require('../images/reliance.png'),
  'tcs.png': require('../images/tcs.png'),
  'infosys.png': require('../images/infosys.png'),
  'hdfc.png': require('../images/hdfc.png'),
  'sbi.png': require('../images/sbi.png'),
  'investara.png': require('../images/investara.png'),
};

const StockDetail = () => {
  const { symbol } = useParams();
  const [stock, setStock] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState(null);
  const [history, setHistory] = useState([]);
  const [showChart, setShowChart] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const [splashText, setSplashText] = useState('');
  const [liveData, setLiveData] = useState([]);

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

  // Live per-second price simulation and chart updates
  useEffect(() => {
    if (!stock) return;
    const interval = setInterval(() => {
      setStock((prev) => {
        if (!prev) return prev;
        const volatility = 0.003; // ~0.3% per second max swing
        const delta = (Math.random() - 0.5) * (prev.currentPrice * volatility);
        const newPrice = Math.max(0.1, Number((prev.currentPrice + delta).toFixed(2)));
        const change = Number((newPrice - (prev.previousClose || newPrice)).toFixed(2));
        const changePercent = prev.previousClose ? Number(((change / prev.previousClose) * 100).toFixed(2)) : 0;
        // Append live point
        setLiveData((ld) => {
          const next = [...ld, { time: Date.now(), price: newPrice }];
          return next.length > 300 ? next.slice(-300) : next;
        });
        return { ...prev, currentPrice: newPrice, change, changePercent };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [stock]);

  const placeOrder = async (orderType) => {
    try {
      const res = await api.post('/orders/place', { symbol, quantity, orderType });
      setMessage(res.data.msg);
      // Show 3-second splash message
      if (orderType === 'BUY') {
        setSplashText(`Congratulations for buying "${stock?.name || symbol}"`);
      } else if (orderType === 'SELL') {
        setSplashText('THANKS');
      } else {
        setSplashText('Order placed');
      }
      setShowSplash(true);
      setTimeout(() => setShowSplash(false), 3000);
    } catch (err) {
      setMessage('Order failed');
    }
  };

  if (!stock) return <div className="loading">Loading stock...</div>;
  // Resolve logo source with safe fallback
  const logoSrc = imageMap[(stock.logo || 'investara.png').toLowerCase()] || imageMap['investara.png'];

  return (
    <section className="container" style={{ padding: '2rem 0' }}>
      {showSplash && (
        <div className="overlay-fade" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300 }}>
          <div className="card-scale-in" style={{ background: '#fff', color: '#111', padding: '2rem 3rem', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
            <h2 style={{ margin: 0, fontSize: '1.75rem', textAlign: 'center' }}>{splashText}</h2>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img src={logoSrc} alt={`${stock.name} logo`} style={{ width: '100px', height: '100px', marginRight: '2rem' }} onError={(e) => { e.currentTarget.src = imageMap['investara.png']; }} />
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
        {showChart && history && history.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <StockChart data={history} />
          </div>
        )}
        {showChart && (
          <div style={{ marginTop: '1rem' }}>
            <LiveChart data={liveData} />
          </div>
        )}
      </div>

      <div style={{ marginTop: '2rem', color: 'white' }}>
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
