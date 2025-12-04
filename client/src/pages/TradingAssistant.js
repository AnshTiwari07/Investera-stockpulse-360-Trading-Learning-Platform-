import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Chip, Stack, Select, MenuItem, FormControl, InputLabel, Card, CardContent, Divider } from '@mui/material';
import api from '../api';

const DISCLAIMER = 'This is not financial advice. Please do your own research or consult a licensed financial advisor before investing.';

const TradingAssistant = () => {
  const [intent, setIntent] = useState('general');
  const [symbols, setSymbols] = useState('');
  const [sectors, setSectors] = useState('');
  const [timeHorizon, setTimeHorizon] = useState('medium');
  const [riskTolerance, setRiskTolerance] = useState('medium');
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const askAssistant = async () => {
    setLoading(true); setError(null);
    try {
      if (intent === 'specific' && symbols.trim()) {
        const sym = symbols.trim().split(/[,\s]+/)[0].toUpperCase();
        const { data } = await api.get(`/market/quote/${sym}`);
        setResult({ type: 'specific', data });
      } else {
        const symbolList = symbols.trim() ? symbols.split(/[,\s]+/).map(s => s.toUpperCase()) : [];
        const sectorList = sectors.trim() ? sectors.split(/[,\s]+/) : [];
        const { data } = await api.post('/market/recommendations', {
          symbols: symbolList,
          sectors: sectorList,
          timeHorizon,
          riskTolerance,
        });
        setResult({ type: 'general', data });
      }
      // compliance logging (best-effort)
      try {
        await api.post('/market/interact', {
          intentType: intent === 'specific' ? 'specific' : 'general',
          inputText,
          structuredPrefs: { symbols, sectors, timeHorizon, riskTolerance },
          response: result,
        });
      } catch (_) {}
    } catch (e) {
      const status = e.response?.status;
      const msg = e.response?.data?.error || e.message || 'Unknown error';
      if (!e.response) {
        setError('Cannot reach backend. Please ensure the server is running on http://localhost:5000.');
        console.error('Network error', e);
      } else if (status === 401) {
        setError('Unauthorized. Please login to request recommendations.');
      } else {
        setError(msg);
      }
      console.error('Assistant error', { status, msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        AI-Powered Trading Assistant
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Provide preferences or a ticker for specific analysis. Responses include rationale, metrics, and risks. Performance evaluation uses a valid change range of 10–80% with decimal support. {DISCLAIMER}
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack spacing={2}>
            <FormControl fullWidth>
              <InputLabel id="intent-label">Query Type</InputLabel>
              <Select labelId="intent-label" value={intent} label="Query Type" onChange={(e) => setIntent(e.target.value)}>
                <MenuItem value="general">General stock suggestions</MenuItem>
                <MenuItem value="specific">Specific stock analysis</MenuItem>
              </Select>
            </FormControl>
            <TextField label={intent === 'specific' ? 'Ticker (e.g., AAPL)' : 'Tickers (optional, comma-separated)'} value={symbols} onChange={(e) => setSymbols(e.target.value)} fullWidth />
            {intent !== 'specific' && (
              <TextField label="Sectors of interest (optional, comma-separated)" value={sectors} onChange={(e) => setSectors(e.target.value)} fullWidth />
            )}
            {intent !== 'specific' && (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl fullWidth>
                  <InputLabel id="horizon-label">Time Horizon</InputLabel>
                  <Select labelId="horizon-label" value={timeHorizon} label="Time Horizon" onChange={(e) => setTimeHorizon(e.target.value)}>
                    <MenuItem value="short">Short (weeks)</MenuItem>
                    <MenuItem value="medium">Medium (months)</MenuItem>
                    <MenuItem value="long">Long (1+ years)</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel id="risk-label">Risk Tolerance</InputLabel>
                  <Select labelId="risk-label" value={riskTolerance} label="Risk Tolerance" onChange={(e) => setRiskTolerance(e.target.value)}>
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            )}
            <TextField label="Optional message or context" value={inputText} onChange={(e) => setInputText(e.target.value)} fullWidth multiline minRows={2} />
            <Button variant="contained" onClick={askAssistant} disabled={loading}>
              {loading ? 'Analyzing...' : 'Ask Assistant'}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
      )}

      {result && result.type === 'general' && (
        <Box>
          <Typography variant="h6" gutterBottom>Top Suggestions</Typography>
          <Stack spacing={2}>
            {result.data?.suggestions?.map((sug) => (
              <Card key={sug.ticker}>
                <CardContent>
                  <Typography variant="h6">{sug.ticker} — {sug.company}</Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1 }}>
                    <Chip label={`Price: ${sug.currentPrice ?? 'N/A'}`} />
                    <Chip label={`P/E: ${sug.keyMetrics?.peRatio ?? 'N/A'}`} />
                    <Chip label={`EPS: ${sug.keyMetrics?.eps ?? 'N/A'}`} />
                    <Chip label={`Dividend: ${sug.keyMetrics?.dividendYield ?? 'N/A'}`} />
                    <Chip label={`Sentiment: ${sug.analystSentiment?.label ?? 'N/A'}`} />
                    <Chip label={`Score: ${sug.score}`} />
                  </Stack>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2">Recent Performance</Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <Chip label={`1M: ${fmtPct(sug.recentPerformance?.['1M'])}`} />
                    <Chip label={`3M: ${fmtPct(sug.recentPerformance?.['3M'])}`} />
                    <Chip label={`6M: ${fmtPct(sug.recentPerformance?.['6M'])}`} />
                    <Chip label={`1Y: ${fmtPct(sug.recentPerformance?.['1Y'])}`} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Risk: {Array.isArray(sug.riskAssessment) ? sug.riskAssessment.join('; ') : 'N/A'}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>{DISCLAIMER}</Typography>
        </Box>
      )}

      {result && result.type === 'specific' && (
        <Box>
          <Typography variant="h6" gutterBottom>Specific Stock Analysis</Typography>
          <Card>
            <CardContent>
              <Typography variant="h6">{result.data?.symbol} — {result.data?.name}</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1 }}>
                <Chip label={`Price: ${result.data?.quote?.currentPrice ?? 'N/A'}`} />
                <Chip label={`Change: ${fmtPct(result.data?.quote?.changePercent)}`} />
                <Chip label={`Sector: ${result.data?.metrics?.sector ?? 'N/A'}`} />
              </Stack>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2">Key Metrics</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Chip label={`P/E: ${result.data?.metrics?.peRatio ?? 'N/A'}`} />
                <Chip label={`EPS: ${result.data?.metrics?.eps ?? 'N/A'}`} />
                <Chip label={`Dividend: ${result.data?.metrics?.dividendYield ?? 'N/A'}`} />
                <Chip label={`Market Cap: ${formatNumber(result.data?.metrics?.marketCap)}`} />
              </Stack>
              <Typography variant="subtitle2" sx={{ mt: 1 }}>Technical Indicators</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Chip label={`RSI: ${fmtNumber(result.data?.indicators?.rsi)}`} />
                <Chip label={`SMA20: ${fmtNumber(result.data?.indicators?.sma20)}`} />
                <Chip label={`SMA50: ${fmtNumber(result.data?.indicators?.sma50)}`} />
              </Stack>
              <Typography variant="subtitle2" sx={{ mt: 1 }}>Recent Performance</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Chip label={`1M: ${fmtPct(result.data?.performance?.['1M'])}`} />
                <Chip label={`3M: ${fmtPct(result.data?.performance?.['3M'])}`} />
                <Chip label={`6M: ${fmtPct(result.data?.performance?.['6M'])}`} />
                <Chip label={`1Y: ${fmtPct(result.data?.performance?.['1Y'])}`} />
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>{DISCLAIMER}</Typography>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
};

function fmtPct(v) { return typeof v === 'number' ? `${v.toFixed(2)}%` : 'N/A'; }
function fmtNumber(v) { return typeof v === 'number' ? v.toFixed(2) : 'N/A'; }
function formatNumber(v) { if (!v && v !== 0) return 'N/A'; return new Intl.NumberFormat().format(v); }

export default TradingAssistant;
