import React, { useMemo, useState } from 'react';
import './MarketOverviewVisuals.css';
import { Box, Grid, Paper, Typography, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { FiTrendingUp, FiTrendingDown, FiActivity, FiPieChart } from 'react-icons/fi';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip as ChartTooltip,
  Filler,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartTooltip, Filler, Legend);

function formatNumber(n) {
  if (n == null || isNaN(n)) return '-';
  return Intl.NumberFormat('en-IN').format(Number(n.toFixed ? n.toFixed(2) : n));
}

export default function MarketOverviewVisuals({ stocks = [], sparklineData = {} }) {
  const [chartLib, setChartLib] = useState('recharts'); // 'recharts' | 'chartjs'

  // Carousel removed for a cleaner market overview; visuals now focus on stats and charts.

  const stats = useMemo(() => {
    const total = stocks.length;
    let adv = 0, dec = 0;
    let avgChangePct = 0;
    stocks.forEach((s) => {
      if (s.changePercent >= 0) adv++; else dec++;
      avgChangePct += (Number(s.changePercent) || 0);
    });
    avgChangePct = total ? avgChangePct / total : 0;
    return { total, adv, dec, avgChangePct };
  }, [stocks]);

  const chartData = useMemo(() => {
    // Aggregate average close across all symbols for each index
    const seriesList = Object.values(sparklineData).filter(Array.isArray);
    const maxLen = Math.max(0, ...seriesList.map((s) => s.length));
    const data = [];
    for (let i = 0; i < maxLen; i++) {
      let sum = 0; let count = 0;
      seriesList.forEach((series) => {
        const point = series[i];
        if (point && typeof point.close === 'number') { sum += point.close; count++; }
      });
      data.push({ idx: i, avgClose: count ? Number((sum / count).toFixed(2)) : null });
    }
    return data;
  }, [sparklineData]);

  return (
    <Box className="market-visuals" sx={{ mb: 3 }}>
      {/* Carousel hero removed to eliminate slide component per requirements */}

      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper className="info-card" elevation={0}>
            <FiPieChart className="info-icon" />
            <div className="info-content">
              <span className="info-label">Total Stocks</span>
              <span className="info-value">{stats.total}</span>
            </div>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper className="info-card" elevation={0}>
            <FiTrendingUp className="info-icon up" />
            <div className="info-content">
              <span className="info-label">Advancers</span>
              <span className="info-value">{stats.adv}</span>
            </div>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper className="info-card" elevation={0}>
            <FiTrendingDown className="info-icon down" />
            <div className="info-content">
              <span className="info-label">Decliners</span>
              <span className="info-value">{stats.dec}</span>
            </div>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper className="info-card" elevation={0}>
            <FiActivity className="info-icon" />
            <div className="info-content">
              <span className="info-label">Avg Change %</span>
              <span className="info-value">{formatNumber(stats.avgChangePct)}%</span>
            </div>
          </Paper>
        </Grid>
      </Grid>

      <Paper className="chart-card" elevation={0}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle2" className="chart-title">Aggregated 7D Performance</Typography>
          <ToggleButtonGroup
            size="small"
            value={chartLib}
            exclusive
            onChange={(_, val) => { if (val) setChartLib(val); }}
            aria-label="Chart library selector"
          >
            <ToggleButton value="recharts" aria-label="Use Recharts">Recharts</ToggleButton>
            <ToggleButton value="chartjs" aria-label="Use Chart.js">Chart.js</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <div className="chart-wrap" aria-label="Aggregated 7D performance chart">
          {chartData.length > 0 ? (
            chartLib === 'recharts' ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4caf50" stopOpacity={0.8}/>
                      <stop offset="100%" stopColor="#4caf50" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="idx" hide />
                  <YAxis hide />
                  <Tooltip formatter={(v) => `₹ ${formatNumber(v)}`} labelFormatter={(l) => `t+${l}`} />
                  <Area type="monotone" dataKey="avgClose" stroke="#4caf50" fillOpacity={1} fill="url(#colorAvg)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <Line
                data={{
                  labels: chartData.map((d) => d.idx),
                  datasets: [{
                    label: 'Avg Close',
                    data: chartData.map((d) => d.avgClose),
                    borderColor: '#4caf50',
                    backgroundColor: 'rgba(76, 175, 80, 0.2)',
                    fill: true,
                    tension: 0.25,
                    pointRadius: 0
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: { display: false },
                    y: { display: false }
                  },
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (ctx) => `₹ ${formatNumber(ctx.parsed.y)}`
                      }
                    }
                  }
                }}
                style={{ width: '100%', height: '220px' }}
              />
            )
          ) : (
            <div className="chart-empty">No chart data available</div>
          )}
        </div>
      </Paper>
    </Box>
  );
}
