import React, { useContext } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { AppBar, Toolbar, Typography, Button, Box, Link } from '@mui/material';
import investaraLogo from '../../images/investara.png';
// logo intentionally removed from navbar to simplify header

const Navbar = () => {
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppBar position="sticky" sx={{ background: 'linear-gradient(90deg, #1f2937 0%, #0f172a 60%, #1f2937 100%)', boxShadow: '0 6px 16px rgba(0,0,0,0.25)' }}>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Link component={RouterLink} to="/" color="inherit" underline="none" sx={{ display: 'flex', alignItems: 'center' }} className="nav-link" aria-label="Homepage">
            <span className="nav-logo" aria-hidden="true">
              <img
                className="brand-img"
                src={process.env.PUBLIC_URL + '/image.png'}
                alt="Investara logo"
                onError={(e) => { e.target.onerror = null; e.target.src = investaraLogo; }}
              />
            </span>
            <Typography variant="h6" component="span" sx={{ ml: 0, fontWeight: 700, letterSpacing: 0.3 }}>Investara</Typography>
          </Link>
        </Box>
        <Box>
          {isAuthenticated ? (
            <>
              <Button color="inherit" component={RouterLink} to="/" className="nav-link" sx={{ mx: 0.5 }}>Dashboard</Button>
              <Button color="inherit" component={RouterLink} to="/portfolio" className="nav-link" sx={{ mx: 0.5 }}>Portfolio</Button>
              <Button color="inherit" component={RouterLink} to="/orders" className="nav-link" sx={{ mx: 0.5 }}>Orders</Button>
              <Button color="inherit" component={RouterLink} to="/calculator" className="nav-link" sx={{ mx: 0.5 }}>Calculator</Button>
              <Button color="inherit" onClick={onLogout} className="nav-link" sx={{ mx: 0.5 }}>Logout ({user?.name})</Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={RouterLink} to="/calculator" className="nav-link" sx={{ mx: 0.5 }}>Calculator</Button>
              <Button color="inherit" component={RouterLink} to="/login" className="nav-link" sx={{ mx: 0.5 }}>Login</Button>
              <Button color="inherit" component={RouterLink} to="/register" className="nav-link" sx={{ mx: 0.5 }}>Register</Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
