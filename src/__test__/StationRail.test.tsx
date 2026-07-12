import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import StationRail from '../components/MapView/StationRail';
import { AirQualityStation, getAqiCategory } from '../aqi';

function makeStation(id: string, name: string, aqi: number): AirQualityStation {
  return {
    id,
    name,
    lat: 0,
    lon: 0,
    aqi,
    category: getAqiCategory(aqi),
    source: 'WAQI',
  };
}

const stations = [
  makeStation('a', 'Berlin AQI Station', 42),
  makeStation('b', 'Munich AQI Station', 156),
  makeStation('c', 'Hamburg AQI Station', 88),
];

test('renders stations sorted worst-first by default', () => {
  render(
    <StationRail
      open
      stations={stations}
      selectedStationId={null}
      onSelectStation={jest.fn()}
      onClose={jest.fn()}
    />
  );

  const rows = screen.getAllByRole('listitem');
  expect(rows[0]).toHaveAccessibleName(/Munich/);
  expect(rows[1]).toHaveAccessibleName(/Hamburg/);
  expect(rows[2]).toHaveAccessibleName(/Berlin/);
});

test('filters stations by search query', async () => {
  const user = userEvent.setup();
  render(
    <StationRail
      open
      stations={stations}
      selectedStationId={null}
      onSelectStation={jest.fn()}
      onClose={jest.fn()}
    />
  );

  await user.type(screen.getByPlaceholderText(/Search stations/i), 'Munich');

  expect(screen.getByText('Munich AQI Station')).toBeInTheDocument();
  expect(screen.queryByText('Berlin AQI Station')).not.toBeInTheDocument();
});

test('cycles the sort order', async () => {
  const user = userEvent.setup();
  render(
    <StationRail
      open
      stations={stations}
      selectedStationId={null}
      onSelectStation={jest.fn()}
      onClose={jest.fn()}
    />
  );

  await user.click(screen.getByRole('button', { name: /Change sorting/i }));

  const rows = screen.getAllByRole('listitem');
  expect(rows[0]).toHaveAccessibleName(/Berlin/);
});

test('selects a station on click', async () => {
  const user = userEvent.setup();
  const onSelect = jest.fn();
  render(
    <StationRail
      open
      stations={stations}
      selectedStationId={null}
      onSelectStation={onSelect}
      onClose={jest.fn()}
    />
  );

  await user.click(screen.getByRole('listitem', { name: /Munich/ }));

  expect(onSelect).toHaveBeenCalledWith(
    expect.objectContaining({ id: 'b', name: 'Munich AQI Station' })
  );
});
