import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChartList from '../ChartList';

describe('ChartList Component', () => {
  it('displays no data message if locations array is empty', () => {
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
    expect(screen.getByText(/No data found/i)).toBeInTheDocument();
  });

  it('renders Chart when data is present', () => {
    const mockLocations = [{
      location: 'Test Location',
      city: 'Test City',
      country: 'US',
      coordinates: { latitude: 40.0, longitude: -74.0 },
      measurements: [{ parameter: 'pm25', value: 10, lastUpdated: '2024-12-20T11:00:00+00:00', unit: 'µg/m³' }]
    }];

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

    // Chart should load if we have data
    expect(screen.queryByText(/No data found/i)).not.toBeInTheDocument();
    // Check if something from Chart component is visible, e.g., 'MapTheAir' logo
    expect(screen.getByText(/MapTheAir/)).toBeInTheDocument();
  });
});
