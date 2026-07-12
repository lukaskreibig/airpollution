import { buildBins } from '../components/Insights/Histogram';
import { AirQualityStation, getAqiCategory } from '../aqi';

function makeStation(aqi: number, index: number): AirQualityStation {
  return {
    id: `s-${index}`,
    name: `Station ${index}`,
    lat: 0,
    lon: 0,
    aqi,
    category: getAqiCategory(aqi),
    source: 'WAQI',
  };
}

test('assigns readings to 25-wide bins with an overflow bucket', () => {
  const stations = [10, 24, 40, 260, 320, 999].map(makeStation);
  const bins = buildBins(stations);

  expect(bins).toHaveLength(13); // 12 regular bins + overflow
  expect(bins[0]).toMatchObject({ from: 0, to: 25, count: 2 });
  expect(bins[1]).toMatchObject({ from: 25, to: 50, count: 1 });
  expect(bins[10]).toMatchObject({ from: 250, to: 275, count: 1 });

  const overflow = bins[bins.length - 1];
  expect(overflow.to).toBeNull();
  expect(overflow.from).toBe(300);
  expect(overflow.count).toBe(2);
});

test('bin colors follow the AQI category scale', () => {
  const bins = buildBins([]);
  expect(bins[0].color).toBe(getAqiCategory(10).color);
  expect(bins[6].color).toBe(getAqiCategory(160).color);
  expect(bins[bins.length - 1].color).toBe(getAqiCategory(301).color);
});
