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

// Expects data like: [{ time: number|Date, price: number }, ...]
const LiveChart = ({ data, strokeColor = '#3f51b5' }) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        No live data
      </div>
    );
  }

  const chartData = {
    labels: data.map((d) => {
      const t = typeof d.time === 'number' ? new Date(d.time) : new Date(d.time);
      return t.toLocaleTimeString();
    }),
    datasets: [
      {
        label: 'Live Price (1s)',
        data: data.map((d) => d.price || 0),
        borderColor: strokeColor,
        borderWidth: 2,
        fill: false,
        pointRadius: 0,
        tension: 0.15,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      x: { display: true },
      y: { display: true },
    },
  };

  return <div style={{ height: 240 }}><Line data={chartData} options={options} /></div>;
};

export default LiveChart;