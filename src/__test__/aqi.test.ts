import {
  calculatePollutantAqi,
  getAqiCategory,
  normalizeWaqiStationDetail,
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
      providerId: '1',
      source: 'WAQI',
    });
  });

  it('normalizes WAQI station detail pollutants, forecast, and attribution', () => {
    const detail = normalizeWaqiStationDetail({
      status: 'ok',
      data: {
        aqi: 82,
        idx: 1437,
        attributions: [{ name: 'WAQI', url: 'https://waqi.info/' }],
        city: {
          geo: [31.2, 121.4],
          name: 'Shanghai',
          url: 'https://aqicn.org/city/shanghai',
        },
        dominentpol: 'pm25',
        iaqi: {
          pm25: { v: 82 },
          pm10: { v: 30 },
          h: { v: 88 },
          t: { v: 26 },
        },
        time: { v: 1779296400 },
        forecast: {
          daily: {
            pm25: [{ day: '2026-05-20', min: 141, avg: 186, max: 252 }],
            uvi: [{ day: '2026-05-20', min: 0, avg: 1, max: 5 }],
          },
        },
      },
    });

    expect(detail).toMatchObject({
      stationId: '1437',
      name: 'Shanghai',
      aqi: 82,
      primaryPollutant: 'pm25',
      primaryPollutantLabel: 'PM2.5',
      sourceUrl: 'https://aqicn.org/city/shanghai',
    });
    expect(detail?.pollutants.map((pollutant) => pollutant.key)).toEqual([
      'pm25',
      'pm10',
    ]);
    expect(detail?.pollutants[0]).toMatchObject({
      label: 'PM2.5',
      value: 82,
      isPrimary: true,
    });
    expect(detail?.forecast).toHaveLength(1);
    expect(detail?.forecast[0]).toMatchObject({
      pollutant: 'pm25',
      avg: 186,
      max: 252,
    });
    expect(detail?.attributions[0].name).toBe('WAQI');
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
