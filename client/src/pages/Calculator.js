import React, { useState } from 'react';
import { Container, Paper, Box, Typography, Grid, Button, TextField } from '@mui/material';

const isAllowedChar = (ch) => /[0-9+\-*/().^]/.test(ch) || ch === '.';

const sanitizeExpression = (expr) => {
  return expr
    .split('')
    .filter((c) => isAllowedChar(c))
    .join('')
    .replace(/\^/g, '**');
};

const evaluateExpression = (expr) => {
  try {
    const sanitized = sanitizeExpression(expr);
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${sanitized})`)();
    if (result === undefined || result === null || Number.isNaN(result)) return 'Error';
    return String(result);
  } catch (e) {
    return 'Error';
  }
};

const toRadians = (val) => (Number(val) * Math.PI) / 180;

const Calculator = () => {
  const [expression, setExpression] = useState('0');

  const setOrAppend = (token) => {
    setExpression((prev) => (prev === '0' ? token : prev + token));
  };

  const onClear = () => setExpression('0');
  const onBackspace = () => setExpression((prev) => (prev.length <= 1 ? '0' : prev.slice(0, -1)));
  const onEquals = () => setExpression((prev) => evaluateExpression(prev));

  const applyUnary = (fn) => {
    setExpression((prev) => {
      const val = Number(prev);
      if (Number.isNaN(val)) return prev; // only apply when display is a number
      const res = fn(val);
      return String(Number.isFinite(res) ? res : 'Error');
    });
  };

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" component="h1" gutterBottom>
        Scientific Calculator
      </Typography>
      <Paper sx={{ p: 2 }} elevation={3}>
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            value={expression}
            inputProps={{ style: { textAlign: 'right', fontSize: 24 } }}
            onChange={(e) => setExpression(e.target.value)}
          />
        </Box>

        <Grid container spacing={1}>
          {/* Top row: clear, backspace, equals */}
          <Grid item xs={4}><Button fullWidth variant="outlined" onClick={onClear}>C</Button></Grid>
          <Grid item xs={4}><Button fullWidth variant="outlined" onClick={onBackspace}>⌫</Button></Grid>
          <Grid item xs={4}><Button fullWidth variant="contained" onClick={onEquals}>=</Button></Grid>

          {/* Numbers */}
          {[7,8,9,4,5,6,1,2,3].map((n) => (
            <Grid key={n} item xs={4}><Button fullWidth variant="outlined" onClick={() => setOrAppend(String(n))}>{n}</Button></Grid>
          ))}
          <Grid item xs={4}><Button fullWidth variant="outlined" onClick={() => setOrAppend('0')}>0</Button></Grid>
          <Grid item xs={4}><Button fullWidth variant="outlined" onClick={() => setOrAppend('.')}>.</Button></Grid>
          <Grid item xs={4}><Button fullWidth variant="outlined" onClick={() => setOrAppend('(')}>(</Button></Grid>

          {/* Operators */}
          {['+', '-', '*', '/', '^', ')'].map((op) => (
            <Grid key={op} item xs={4}><Button fullWidth variant="outlined" onClick={() => setOrAppend(op)}>{op}</Button></Grid>
          ))}

          {/* Scientific functions operate on current display value */}
          <Grid item xs={4}><Button fullWidth variant="outlined" onClick={() => applyUnary((v) => Math.sin(toRadians(v)))}>sin</Button></Grid>
          <Grid item xs={4}><Button fullWidth variant="outlined" onClick={() => applyUnary((v) => Math.cos(toRadians(v)))}>cos</Button></Grid>
          <Grid item xs={4}><Button fullWidth variant="outlined" onClick={() => applyUnary((v) => Math.tan(toRadians(v)))}>tan</Button></Grid>
          <Grid item xs={4}><Button fullWidth variant="outlined" onClick={() => applyUnary((v) => Math.log10(v))}>log</Button></Grid>
          <Grid item xs={4}><Button fullWidth variant="outlined" onClick={() => applyUnary((v) => Math.log(v))}>ln</Button></Grid>
          <Grid item xs={4}><Button fullWidth variant="outlined" onClick={() => applyUnary((v) => Math.sqrt(v))}>√</Button></Grid>
          <Grid item xs={4}><Button fullWidth variant="outlined" onClick={() => applyUnary((v) => v * v)}>x²</Button></Grid>
          <Grid item xs={4}><Button fullWidth variant="outlined" onClick={() => applyUnary((v) => 1 / v)}>1/x</Button></Grid>
          <Grid item xs={4}><Button fullWidth variant="outlined" onClick={() => setOrAppend('3.141592653589793')}>π</Button></Grid>
          <Grid item xs={4}><Button fullWidth variant="outlined" onClick={() => setOrAppend('2.718281828459045')}>e</Button></Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default Calculator;