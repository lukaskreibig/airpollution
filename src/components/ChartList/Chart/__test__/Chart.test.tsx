import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Chart from '../Chart';

// Mock Plotly so we don't do real rendering
jest.mock('react-plotly.js', () => ({
  __esModule: true,
  default: () => <div data-testid="plotly-mock">Mocked Plotly</div>,
}));

describe('Chart (Unit Tests)', () => {
  it('renders the Plot if valid measurements exist (chart="1")', () => {
    // Provide valid pm25 and/or pm10 so that calculateBigChart returns data
    const mockLocations = [
      {
        location: 'Good Location',
        city: 'Test City',
        country: 'US',
        coordinates: { latitude: 40, longitude: -74 },
        measurements: [
          {
            parameter: 'pm25', // "pm25" is recognized in calculateBigChart
            value: 25, // > 0 => valid
            lastUpdated: '2025-01-01T12:00:00Z',
            unit: 'µg/m³',
          },
          {
            parameter: 'pm10',
            value: 50,
            lastUpdated: '2025-01-01T12:00:00Z',
            unit: 'µg/m³',
          },
        ],
      },
    ];

    render(
      <Chart
        locations={mockLocations}
        chart="1" // triggers calculateBigChart
        country="50"
        countriesList={[]}
        showSidebar={false}
        setShowSidebar={jest.fn()}
      />
    );

    // Because we have valid pm25/pm10 data, chart=1 => we expect "Mocked Plotly"
    expect(screen.getByTestId('plotly-mock')).toBeInTheDocument();

    // Confirm the fallback text is NOT present
    expect(
      screen.queryByText(/No data available to display\./i)
    ).not.toBeInTheDocument();
  });
});
