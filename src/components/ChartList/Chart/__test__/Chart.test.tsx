import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Chart from '../Chart';
import { getAqiCategory } from '../../../../aqi';

// Mock Plotly so we don't do real rendering
jest.mock('react-plotly.js', () => ({
  __esModule: true,
  default: () => <div data-testid="plotly-mock">Mocked Plotly</div>,
}));

describe('Chart (Unit Tests)', () => {
  it('renders the Plot if valid AQI stations exist (chart="1")', () => {
    const mockLocations = [
      {
        id: 'station-1',
        name: 'Good Location',
        lat: 40,
        lon: -74,
        aqi: 42,
        category: getAqiCategory(42),
        updatedAt: 'Jan 1, 2025, 12:00 PM UTC',
        source: 'WAQI' as const,
      },
    ];

    render(
      <Chart
        locations={mockLocations}
        chart="1"
        showSidebar={false}
        setShowSidebar={jest.fn()}
      />
    );

    expect(screen.getByTestId('plotly-mock')).toBeInTheDocument();

    // Confirm the fallback text is NOT present
    expect(
      screen.queryByText(/No data available to display\./i)
    ).not.toBeInTheDocument();
  });
});
