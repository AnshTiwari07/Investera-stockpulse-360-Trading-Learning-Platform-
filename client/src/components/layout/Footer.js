import React from 'react';
import { Box, Container, Typography } from '@mui/material';

const Footer = () => (
  <Box component="footer" sx={{ bgcolor: 'primary.main', color: 'white', py: 2, mt: 'auto' }}>
    <Container maxWidth="lg">
      <Typography variant="body2" align="center">
        Investara Clone · MERN Stack · Real trading platform @2025
      </Typography>
    </Container>
  </Box>
);

export default Footer;
