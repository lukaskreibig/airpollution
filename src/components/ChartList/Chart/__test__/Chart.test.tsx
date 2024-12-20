import { render, screen } from '@testing-library/react';
import Chart from '../Chart';
import '@testing-library/jest-dom';

describe('Chart Component', () => {
  it('shows no data message if processedLocs are empty', () => {
    // Locations with no valid measurements after filtering
    const mockLocations = [{
      location: 'Test Location',
      city: 'Test City',
      country: 'US',
      coordinates: { latitude: 40.0, longitude: -74.0 },
      measurements: [] // no measurements
    }];

    render(
      <Chart
        locations={mockLocations}
        chart="1"
        country="50"
        countriesList={[]}
        showSidebar={true}
        setShowSidebar={jest.fn()}
      />
    );

    expect(screen.getByText(/No data available to display./i)).toBeInTheDocument();
  });
});
