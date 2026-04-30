import { getAqiCategory } from '../aqi';
import { computeAqiInsights } from '../insights';

describe('AQI insights', () => {
  it('summarizes loaded station AQI values', () => {
    const stations = [
      {
        id: 'station-good',
        name: 'Good Station',
        lat: 1,
        lon: 1,
        aqi: 25,
        category: getAqiCategory(25),
        updatedAtTimestamp: 100,
        source: 'WAQI' as const,
      },
      {
        id: 'station-unhealthy',
        name: 'Unhealthy Station',
        lat: 2,
        lon: 2,
        aqi: 175,
        category: getAqiCategory(175),
        updatedAtTimestamp: 200,
        source: 'WAQI' as const,
      },
    ];

    const insights = computeAqiInsights(stations, 200);

    expect(insights.stationCount).toBe(2);
    expect(insights.averageAqi).toBe(100);
    expect(insights.worstStation?.name).toBe('Unhealthy Station');
    expect(insights.cleanestStation?.name).toBe('Good Station');
    expect(insights.unhealthyCount).toBe(1);
    expect(insights.unhealthyPercent).toBe(50);
    expect(insights.knownFreshnessCount).toBe(2);
    expect(insights.freshStationCount).toBe(2);
    expect(insights.dominantCategory?.count).toBe(1);
    expect(
      insights.categoryCounts.find((category) => category.key === 'good')?.count
    ).toBe(1);
  });
});
