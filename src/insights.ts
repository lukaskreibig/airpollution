import {
  AirQualityStation,
  AQI_CATEGORIES,
  AqiCategoryKey,
  getAqiCategory,
} from './aqi';

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
  medianAqi: number | null;
  p90Aqi: number | null;
  representativeP90Aqi: number | null;
  p95Aqi: number | null;
  worstStation: AirQualityStation | null;
  representativeWorstStation: AirQualityStation | null;
  cleanestStation: AirQualityStation | null;
  dominantCategory: CategoryCount | null;
  riskCategory: CategoryCount | null;
  unhealthyCount: number;
  unhealthyPercent: number;
  hazardousCount: number;
  hazardousPercent: number;
  extremeCount: number;
  extremePercent: number;
  knownFreshnessCount: number;
  freshStationCount: number;
  staleCount: number;
  unknownFreshnessCount: number;
  freshnessPercent: number;
  latestUpdate?: string;
  latestUpdateTimestamp?: number;
  categoryCounts: CategoryCount[];
  topStations: AirQualityStation[];
  cleanestStations: AirQualityStation[];
}

const STALE_AFTER_MS = 6 * 60 * 60 * 1000;
const EXTREME_AQI_THRESHOLD = 500;

function sortByAqiDesc(a: AirQualityStation, b: AirQualityStation): number {
  return b.aqi - a.aqi || a.name.localeCompare(b.name);
}

function sortByAqiAsc(a: AirQualityStation, b: AirQualityStation): number {
  return a.aqi - b.aqi || a.name.localeCompare(b.name);
}

function percentile(values: number[], ratio: number): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil(ratio * sorted.length) - 1;
  return sorted[Math.min(Math.max(index, 0), sorted.length - 1)];
}

export function computeAqiInsights(
  stations: AirQualityStation[],
  now = Date.now()
): AqiInsights {
  const stationCount = stations.length;
  const sortedHigh = [...stations].sort(sortByAqiDesc);
  const sortedLow = [...stations].sort(sortByAqiAsc);
  const aqiValues = stations.map((station) => station.aqi);
  const representativeAqiValues = stations
    .filter((station) => station.aqi <= EXTREME_AQI_THRESHOLD)
    .map((station) => station.aqi);
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
  const dominantCategory =
    [...categoryCounts].sort((a, b) => b.count - a.count)[0] || null;
  const p90Aqi = percentile(aqiValues, 0.9);
  const representativeP90Aqi = percentile(
    representativeAqiValues.length ? representativeAqiValues : aqiValues,
    0.9
  );
  const p95Aqi = percentile(aqiValues, 0.95);
  const riskCategory =
    representativeP90Aqi === null
      ? null
      : categoryCounts.find(
          (category) =>
            category.key === getAqiCategory(representativeP90Aqi).key
        ) || null;
  const knownFreshnessCount = stations.filter(
    (station) => typeof station.updatedAtTimestamp === 'number'
  ).length;
  const staleCount = stations.filter(
    (station) =>
      typeof station.updatedAtTimestamp === 'number' &&
      now - station.updatedAtTimestamp > STALE_AFTER_MS
  ).length;
  const freshStationCount = knownFreshnessCount - staleCount;
  const unhealthyCount = stations.filter((station) => station.aqi > 100).length;
  const hazardousCount = stations.filter((station) => station.aqi > 300).length;
  const extremeCount = stations.filter(
    (station) => station.aqi > EXTREME_AQI_THRESHOLD
  ).length;
  const representativeWorstStation =
    sortedHigh.find((station) => station.aqi <= EXTREME_AQI_THRESHOLD) ||
    sortedHigh[0] ||
    null;
  return {
    stationCount,
    averageAqi: stationCount ? Math.round(totalAqi / stationCount) : null,
    medianAqi: percentile(aqiValues, 0.5),
    p90Aqi,
    representativeP90Aqi,
    p95Aqi,
    worstStation: sortedHigh[0] || null,
    representativeWorstStation,
    cleanestStation: sortedLow[0] || null,
    dominantCategory,
    riskCategory,
    unhealthyCount,
    unhealthyPercent: stationCount ? (unhealthyCount / stationCount) * 100 : 0,
    hazardousCount,
    hazardousPercent: stationCount ? (hazardousCount / stationCount) * 100 : 0,
    extremeCount,
    extremePercent: stationCount ? (extremeCount / stationCount) * 100 : 0,
    knownFreshnessCount,
    freshStationCount,
    staleCount,
    unknownFreshnessCount: stationCount - knownFreshnessCount,
    freshnessPercent: knownFreshnessCount
      ? (freshStationCount / knownFreshnessCount) * 100
      : 0,
    latestUpdate: latestStation?.updatedAt,
    latestUpdateTimestamp: latestStation?.updatedAtTimestamp,
    categoryCounts,
    topStations: sortedHigh.slice(0, 8),
    cleanestStations: sortedLow.slice(0, 8),
  };
}
