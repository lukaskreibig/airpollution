import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChartList from '../ChartList';

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
        chart="3"
        country="50"
        countriesList={[]}
        showSidebar={true}
        setShowSidebar={jest.fn()}
      />
    );

    expect(
      screen.getByText(/No data found\. Possibly no up-to-date data/i)
    ).toBeInTheDocument();

    expect(screen.queryByText('Mocked Chart')).not.toBeInTheDocument();
  });

  it('renders <Chart> if locations is non-empty', () => {
    const mockLocations = [
      {
        location: 'Test Location',
        city: 'Test City',
        country: 'US',
        coordinates: { latitude: 40, longitude: -74 },
        measurements: [
          {
            parameter: 'pm25',
            value: 15,
            lastUpdated: '2025-01-01T12:00:00Z',
            unit: 'µg/m³',
          },
        ],
      },
    ];

    render(
      <ChartList
        locations={mockLocations}
        chart="3"
        country="50"
        countriesList={[]}
        showSidebar={true}
        setShowSidebar={jest.fn()}
      />
    );

    expect(
      screen.queryByText(/No data found\. Possibly no up-to-date data/i)
    ).not.toBeInTheDocument();

    expect(screen.getByText('Mocked Chart')).toBeInTheDocument();
  });
});
