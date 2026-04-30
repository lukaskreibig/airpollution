import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Chart from '../Chart';
import { getAqiCategory } from '../../../../aqi';

describe('Chart (Unit Tests)', () => {
  it('renders insights if valid AQI stations exist', () => {
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
        viewMode="insights"
        showSidebar={false}
        setShowSidebar={jest.fn()}
      />
    );

    expect(screen.getByText(/Air quality insights/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Good Location/i).length).toBeGreaterThan(0);
  });
});
