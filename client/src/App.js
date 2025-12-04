import React, { useEffect, useState, useContext } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Container, Box } from '@mui/material';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Portfolio from './pages/Portfolio';
import Orders from './pages/Orders';
import Transactions from './pages/Transactions';
import StockDetail from './pages/StockDetail';
import NotFound from './pages/NotFound';
import Calculator from './pages/Calculator';
import TradingAssistant from './pages/TradingAssistant';
import FloatingAssistant from './components/FloatingAssistant';
import VoiceFab from './components/VoiceFab';
import SplashScreen from './components/SplashScreen';
import appLogo from './images/investara.png';
import { VoiceProvider, VoiceContext } from './context/VoiceContext';
import VoiceControls from './components/VoiceControls';

const AppBody = () => {
  const [showSplash, setShowSplash] = useState(true);
  const { welcome } = useContext(VoiceContext);

  useEffect(() => {
    const handleLoad = () => setShowSplash(false);
    window.addEventListener('load', handleLoad);
    const t = setTimeout(() => setShowSplash(false), 1600);
    // Call welcome greeting once the splash is almost done
    const w = setTimeout(() => { try { welcome(); } catch {} }, 1800);
    return () => {
      window.removeEventListener('load', handleLoad);
      clearTimeout(t);
      clearTimeout(w);
    };
  }, []);

  return (
    <BrowserRouter>
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <SplashScreen show={showSplash} logoSrc={appLogo} />
        <Navbar />
        <Container maxWidth="lg" sx={{ flexGrow: 1, py: 3 }} className="page-fade">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/calculator" element={<Calculator />} />
            <Route path="/assistant" element={<TradingAssistant />} />
            <Route path="/stock/:symbol" element={<StockDetail />} />
            <Route path="/stocks/:symbol" element={<StockDetail />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Container>
        <Footer />
        <FloatingAssistant />
        <VoiceFab />
        <VoiceControls />
      </Box>
    </BrowserRouter>
  );
};

const App = () => (
  <VoiceProvider>
    <AppBody />
  </VoiceProvider>
);

export default App;
