import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dashboard from '../pages/Dashboard';

// Mock router link to avoid navigation during tests
jest.mock('react-router-dom', () => ({
  Link: ({ children, ...props }) => <a {...props}>{children}</a>,
}));

// Mock API instance
jest.mock('../api', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

const api = require('../api');

describe('Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows error alert when stocks fetch fails', async () => {
    api.get.mockRejectedValueOnce(new Error('500'));
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText(/Failed to load market data/i)).toBeInTheDocument();
    });
  });

  test('renders empty state when no stocks are available', async () => {
    api.get.mockResolvedValueOnce({ data: [] });
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText(/No stocks available/i)).toBeInTheDocument();
    });
  });

  test('handles canceled sparkline requests without errors', async () => {
    // First call: /stocks
    api.get.mockResolvedValueOnce({ data: [{ symbol: 'TEST', name: 'Test Corp', currentPrice: 100 }] });
    // Second call: /stocks/TEST/history?range=7D — simulate cancellation
    const canceledError = new Error('canceled');
    canceledError.code = 'ERR_CANCELED';
    api.get.mockRejectedValueOnce(canceledError);

    render(<Dashboard />);

    // Confirm core UI loads and label is present; no crash on canceled history
    await waitFor(() => {
      expect(screen.getByText(/Market Overview/i)).toBeInTheDocument();
    });
    // Ensure no general error alert is displayed (stocks fetched successfully)
    expect(screen.queryByText(/Failed to load market data/i)).not.toBeInTheDocument();
  });
});
