import {
  calculatePollutantAqi,
  getAqiCategory,
  normalizeWaqiStations,
} from '../aqi';

describe('AQI domain helpers', () => {
  it.each([
    [50, 'Good'],
    [51, 'Moderate'],
    [100, 'Moderate'],
    [101, 'Unhealthy for Sensitive Groups'],
    [150, 'Unhealthy for Sensitive Groups'],
    [151, 'Unhealthy'],
    [200, 'Unhealthy'],
    [201, 'Very Unhealthy'],
    [300, 'Very Unhealthy'],
    [301, 'Hazardous'],
  ])('categorizes AQI %i as %s', (aqi, label) => {
    expect(getAqiCategory(aqi).label).toBe(label);
  });

  it('normalizes valid WAQI map stations and filters invalid AQI values', () => {
    const normalized = normalizeWaqiStations({
      status: 'ok',
      data: [
        {
          uid: 1,
          aqi: '42',
          lat: '52.52',
          lon: '13.405',
          station: { name: 'Berlin Station', time: '2026-04-30T12:00:00Z' },
        },
        { uid: 2, aqi: '-', lat: 48, lon: 11, station: { name: 'Invalid' } },
      ],
    });

    expect(normalized).toHaveLength(1);
    expect(normalized[0]).toMatchObject({
      id: 'waqi-1',
      name: 'Berlin Station',
      lat: 52.52,
      lon: 13.405,
      aqi: 42,
      source: 'WAQI',
    });
  });

  it('uses current EPA PM2.5 breakpoints for estimated OpenAQ fallback AQI', () => {
    expect(
      calculatePollutantAqi({
        parameter: 'pm25',
        value: 9,
        unit: 'µg/m³',
      })
    ).toBe(50);
    expect(
      calculatePollutantAqi({
        parameter: 'pm25',
        value: 9.1,
        unit: 'µg/m³',
      })
    ).toBe(51);
  });
});
