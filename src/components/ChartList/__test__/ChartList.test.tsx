import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChartList from '../ChartList';
import { getAqiCategory } from '../../../aqi';

// 1) Mock the *child* Chart component
jest.mock('../Chart/Chart', () => ({
  __esModule: true,
  default: () => <div>Mocked Chart</div>,
}));

describe('ChartList (Unit Tests)', () => {
  it('displays "No data found..." if locations array is empty', () => {
    render(
      <ChartList
        locations={[]}
        viewMode="map"
        showSidebar={true}
        setShowSidebar={jest.fn()}
      />
    );

    expect(screen.getByText(/No live AQI stations found/i)).toBeInTheDocument();

    expect(screen.queryByText('Mocked Chart')).not.toBeInTheDocument();
  });

  it('renders <Chart> if locations is non-empty', () => {
    const mockLocations = [
      {
        id: 'station-1',
        name: 'Test Location',
        lat: 40,
        lon: -74,
        aqi: 42,
        category: getAqiCategory(42),
        updatedAt: 'Jan 1, 2025, 12:00 PM UTC',
        source: 'WAQI' as const,
      },
    ];

    render(
      <ChartList
        locations={mockLocations}
        viewMode="map"
        showSidebar={true}
        setShowSidebar={jest.fn()}
      />
    );

    expect(
      screen.queryByText(/No live AQI stations found/i)
    ).not.toBeInTheDocument();

    expect(screen.getByText('Mocked Chart')).toBeInTheDocument();
  });
});
