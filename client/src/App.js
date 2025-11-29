import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Container, Box } from '@mui/material';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Portfolio from './pages/Portfolio';
import Orders from './pages/Orders';
import StockDetail from './pages/StockDetail';
import NotFound from './pages/NotFound';
import Calculator from './pages/Calculator';

const App = () => {
  return (
    <BrowserRouter>
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <Container maxWidth="lg" sx={{ flexGrow: 1, py: 3 }} className="page-fade">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/calculator" element={<Calculator />} />
            <Route path="/stock/:symbol" element={<StockDetail />} />
            <Route path="/stocks/:symbol" element={<StockDetail />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Container>
        <Footer />
      </Box>
    </BrowserRouter>
  );
};

export default App;