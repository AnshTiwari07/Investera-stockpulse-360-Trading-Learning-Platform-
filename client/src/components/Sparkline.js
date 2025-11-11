import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Sparkline = ({ data, dataKey = 'close', strokeColor = '#4caf50' }) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return <div style={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No data</div>;
  }

  const chartData = {
    labels: data.map((d, index) => index),
    datasets: [
      {
        label: 'Price',
        data: data.map((d) => d[dataKey] || d.price || 0),
        borderColor: strokeColor,
        borderWidth: 2,
        fill: false,
        pointRadius: 0,
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        display: false,
      },
    },
  };

  return <Line data={chartData} options={options} />;
};

export default Sparkline;