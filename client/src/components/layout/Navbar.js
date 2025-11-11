import React, { useContext } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { AppBar, Toolbar, Typography, Button, Box, Link } from '@mui/material';
import logo from '../../images/zerodha.png';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppBar position="sticky">
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Link component={RouterLink} to="/" color="inherit" underline="none" sx={{ display: 'flex', alignItems: 'center' }}>
            <img
              src={logo}
              alt="Zerodha"
              style={{ height: 28, marginRight: 8 }}
            />
            <Typography variant="h6" component="span">Zerodha</Typography>
          </Link>
        </Box>
        <Box>
          {isAuthenticated ? (
            <>
              <Button color="inherit" component={RouterLink} to="/">Dashboard</Button>
              <Button color="inherit" component={RouterLink} to="/portfolio">Portfolio</Button>
              <Button color="inherit" component={RouterLink} to="/orders">Orders</Button>
              <Button color="inherit" onClick={onLogout}>Logout ({user?.name})</Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={RouterLink} to="/login">Login</Button>
              <Button color="inherit" component={RouterLink} to="/register">Register</Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;