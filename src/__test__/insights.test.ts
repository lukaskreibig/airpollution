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
      {
        id: 'station-extreme',
        name: 'Extreme Station',
        lat: 3,
        lon: 3,
        aqi: 999,
        category: getAqiCategory(999),
        updatedAtTimestamp: 200,
        source: 'WAQI' as const,
      },
    ];

    const insights = computeAqiInsights(stations, 200);

    expect(insights.stationCount).toBe(3);
    expect(insights.averageAqi).toBe(400);
    expect(insights.medianAqi).toBe(175);
    expect(insights.p90Aqi).toBe(999);
    expect(insights.representativeP90Aqi).toBe(175);
    expect(insights.p95Aqi).toBe(999);
    expect(insights.worstStation?.name).toBe('Extreme Station');
    expect(insights.representativeWorstStation?.name).toBe('Unhealthy Station');
    expect(insights.cleanestStation?.name).toBe('Good Station');
    expect(insights.unhealthyCount).toBe(2);
    expect(Math.round(insights.unhealthyPercent)).toBe(67);
    expect(insights.extremeCount).toBe(1);
    expect(Math.round(insights.extremePercent)).toBe(33);
    expect(insights.knownFreshnessCount).toBe(3);
    expect(insights.freshStationCount).toBe(3);
    expect(insights.riskCategory?.key).toBe('unhealthy');
    expect(insights.dominantCategory?.count).toBe(1);
    expect(
      insights.categoryCounts.find((category) => category.key === 'good')?.count
    ).toBe(1);
  });
});
