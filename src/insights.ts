import { AirQualityStation, AQI_CATEGORIES, AqiCategoryKey } from './aqi';

export interface CategoryCount {
  key: AqiCategoryKey;
  label: string;
  shortLabel: string;
  color: string;
  foreground: string;
  range: string;
  count: number;
  percent: number;
}

export interface AqiInsights {
  stationCount: number;
  averageAqi: number | null;
  worstStation: AirQualityStation | null;
  cleanestStation: AirQualityStation | null;
  unhealthyCount: number;
  hazardousCount: number;
  staleCount: number;
  latestUpdate?: string;
  latestUpdateTimestamp?: number;
  categoryCounts: CategoryCount[];
  topStations: AirQualityStation[];
  cleanestStations: AirQualityStation[];
}

const STALE_AFTER_MS = 6 * 60 * 60 * 1000;

function sortByAqiDesc(a: AirQualityStation, b: AirQualityStation): number {
  return b.aqi - a.aqi || a.name.localeCompare(b.name);
}

function sortByAqiAsc(a: AirQualityStation, b: AirQualityStation): number {
  return a.aqi - b.aqi || a.name.localeCompare(b.name);
}

export function computeAqiInsights(
  stations: AirQualityStation[],
  now = Date.now()
): AqiInsights {
  const stationCount = stations.length;
  const sortedHigh = [...stations].sort(sortByAqiDesc);
  const sortedLow = [...stations].sort(sortByAqiAsc);
  const totalAqi = stations.reduce((sum, station) => sum + station.aqi, 0);
  const latestStation = stations
    .filter((station) => typeof station.updatedAtTimestamp === 'number')
    .sort(
      (a, b) => (b.updatedAtTimestamp || 0) - (a.updatedAtTimestamp || 0)
    )[0];

  const categoryCounts = AQI_CATEGORIES.map((category) => {
    const count = stations.filter(
      (station) => station.category.key === category.key
    ).length;

    return {
      key: category.key,
      label: category.label,
      shortLabel: category.shortLabel,
      color: category.color,
      foreground: category.foreground,
      range: category.range,
      count,
      percent: stationCount ? (count / stationCount) * 100 : 0,
    };
  });

  return {
    stationCount,
    averageAqi: stationCount ? Math.round(totalAqi / stationCount) : null,
    worstStation: sortedHigh[0] || null,
    cleanestStation: sortedLow[0] || null,
    unhealthyCount: stations.filter((station) => station.aqi > 100).length,
    hazardousCount: stations.filter((station) => station.aqi > 300).length,
    staleCount: stations.filter(
      (station) =>
        typeof station.updatedAtTimestamp === 'number' &&
        now - station.updatedAtTimestamp > STALE_AFTER_MS
    ).length,
    latestUpdate: latestStation?.updatedAt,
    latestUpdateTimestamp: latestStation?.updatedAtTimestamp,
    categoryCounts,
    topStations: sortedHigh.slice(0, 8),
    cleanestStations: sortedLow.slice(0, 8),
  };
}
