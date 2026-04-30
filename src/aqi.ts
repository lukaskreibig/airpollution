export type AqiCategoryKey =
  | 'good'
  | 'moderate'
  | 'unhealthy-sensitive'
  | 'unhealthy'
  | 'very-unhealthy'
  | 'hazardous'
  | 'unknown';

export interface AqiCategory {
  key: AqiCategoryKey;
  label: string;
  shortLabel: string;
  range: string;
  color: string;
  foreground: string;
  healthMessage: string;
}

export interface AirQualityStation {
  id: string;
  name: string;
  lat: number;
  lon: number;
  aqi: number;
  category: AqiCategory;
  updatedAt?: string;
  updatedAtTimestamp?: number;
  source: 'WAQI' | 'OpenAQ';
}

export interface WaqiMapStation {
  uid?: number | string;
  aqi?: number | string;
  lat?: number | string;
  lon?: number | string;
  station?: {
    name?: string;
    time?: string;
  };
}

export interface PollutantMeasurement {
  parameter: string;
  value: number;
  unit?: string;
}

interface Breakpoint {
  cLow: number;
  cHigh: number;
  iLow: number;
  iHigh: number;
}

export const AQI_CATEGORIES: AqiCategory[] = [
  {
    key: 'good',
    label: 'Good',
    shortLabel: 'Good',
    range: '0-50',
    color: '#009966',
    foreground: '#071f17',
    healthMessage: 'Air quality is satisfactory for most people.',
  },
  {
    key: 'moderate',
    label: 'Moderate',
    shortLabel: 'Moderate',
    range: '51-100',
    color: '#ffde33',
    foreground: '#1f2933',
    healthMessage: 'Unusually sensitive people may consider reducing exposure.',
  },
  {
    key: 'unhealthy-sensitive',
    label: 'Unhealthy for Sensitive Groups',
    shortLabel: 'Sensitive groups',
    range: '101-150',
    color: '#ff9933',
    foreground: '#1f2933',
    healthMessage: 'Sensitive groups should reduce prolonged outdoor exertion.',
  },
  {
    key: 'unhealthy',
    label: 'Unhealthy',
    shortLabel: 'Unhealthy',
    range: '151-200',
    color: '#cc0033',
    foreground: '#ffffff',
    healthMessage: 'Everyone may begin to experience health effects.',
  },
  {
    key: 'very-unhealthy',
    label: 'Very Unhealthy',
    shortLabel: 'Very unhealthy',
    range: '201-300',
    color: '#660099',
    foreground: '#ffffff',
    healthMessage: 'Health alert: avoid prolonged outdoor exertion.',
  },
  {
    key: 'hazardous',
    label: 'Hazardous',
    shortLabel: 'Hazardous',
    range: '301+',
    color: '#7e0023',
    foreground: '#ffffff',
    healthMessage: 'Health warning: avoid outdoor exertion.',
  },
];

export const UNKNOWN_AQI_CATEGORY: AqiCategory = {
  key: 'unknown',
  label: 'Unknown',
  shortLabel: 'Unknown',
  range: 'n/a',
  color: '#7a869a',
  foreground: '#ffffff',
  healthMessage: 'Current AQI is not available for this station.',
};

const EPA_AQI_BREAKPOINTS: Record<string, Breakpoint[]> = {
  pm25: [
    { cLow: 0, cHigh: 9, iLow: 0, iHigh: 50 },
    { cLow: 9.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
    { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
    { cLow: 55.5, cHigh: 125.4, iLow: 151, iHigh: 200 },
    { cLow: 125.5, cHigh: 225.4, iLow: 201, iHigh: 300 },
    { cLow: 225.5, cHigh: 325.4, iLow: 301, iHigh: 500 },
  ],
  pm10: [
    { cLow: 0, cHigh: 54, iLow: 0, iHigh: 50 },
    { cLow: 55, cHigh: 154, iLow: 51, iHigh: 100 },
    { cLow: 155, cHigh: 254, iLow: 101, iHigh: 150 },
    { cLow: 255, cHigh: 354, iLow: 151, iHigh: 200 },
    { cLow: 355, cHigh: 424, iLow: 201, iHigh: 300 },
    { cLow: 425, cHigh: 604, iLow: 301, iHigh: 500 },
  ],
  co: [
    { cLow: 0, cHigh: 4.4, iLow: 0, iHigh: 50 },
    { cLow: 4.5, cHigh: 9.4, iLow: 51, iHigh: 100 },
    { cLow: 9.5, cHigh: 12.4, iLow: 101, iHigh: 150 },
    { cLow: 12.5, cHigh: 15.4, iLow: 151, iHigh: 200 },
    { cLow: 15.5, cHigh: 30.4, iLow: 201, iHigh: 300 },
    { cLow: 30.5, cHigh: 50.4, iLow: 301, iHigh: 500 },
  ],
  no2: [
    { cLow: 0, cHigh: 53, iLow: 0, iHigh: 50 },
    { cLow: 54, cHigh: 100, iLow: 51, iHigh: 100 },
    { cLow: 101, cHigh: 360, iLow: 101, iHigh: 150 },
    { cLow: 361, cHigh: 649, iLow: 151, iHigh: 200 },
    { cLow: 650, cHigh: 1249, iLow: 201, iHigh: 300 },
    { cLow: 1250, cHigh: 2049, iLow: 301, iHigh: 500 },
  ],
  o3: [
    { cLow: 0, cHigh: 0.054, iLow: 0, iHigh: 50 },
    { cLow: 0.055, cHigh: 0.07, iLow: 51, iHigh: 100 },
    { cLow: 0.071, cHigh: 0.085, iLow: 101, iHigh: 150 },
    { cLow: 0.086, cHigh: 0.105, iLow: 151, iHigh: 200 },
    { cLow: 0.106, cHigh: 0.2, iLow: 201, iHigh: 300 },
  ],
  so2: [
    { cLow: 0, cHigh: 35, iLow: 0, iHigh: 50 },
    { cLow: 36, cHigh: 75, iLow: 51, iHigh: 100 },
    { cLow: 76, cHigh: 185, iLow: 101, iHigh: 150 },
    { cLow: 186, cHigh: 304, iLow: 151, iHigh: 200 },
    { cLow: 305, cHigh: 604, iLow: 201, iHigh: 300 },
    { cLow: 605, cHigh: 1004, iLow: 301, iHigh: 500 },
  ],
};

function toFiniteNumber(value: unknown): number | null {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number.parseFloat(value)
        : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeParameter(parameter: string): string {
  return parameter.toLowerCase().replace('.', '').replace('_', '');
}

function truncateForAqi(parameter: string, value: number): number {
  if (parameter === 'pm25' || parameter === 'co') {
    return Math.floor(value * 10) / 10;
  }
  if (parameter === 'o3') {
    return Math.floor(value * 1000) / 1000;
  }
  if (parameter === 'pm10' || parameter === 'no2' || parameter === 'so2') {
    return Math.floor(value);
  }
  return value;
}

export function parseAqi(value: unknown): number | null {
  const parsed = toFiniteNumber(value);
  if (parsed === null || parsed < 0) return null;
  return Math.round(parsed);
}

export function getAqiCategory(aqi: number | null | undefined): AqiCategory {
  if (typeof aqi !== 'number' || !Number.isFinite(aqi) || aqi < 0) {
    return UNKNOWN_AQI_CATEGORY;
  }
  if (aqi <= 50) return AQI_CATEGORIES[0];
  if (aqi <= 100) return AQI_CATEGORIES[1];
  if (aqi <= 150) return AQI_CATEGORIES[2];
  if (aqi <= 200) return AQI_CATEGORIES[3];
  if (aqi <= 300) return AQI_CATEGORIES[4];
  return AQI_CATEGORIES[5];
}

export function aqiColor(aqi: number | null | undefined): string {
  return getAqiCategory(aqi).color;
}

export function formatAqi(aqi: number | null | undefined): string {
  return typeof aqi === 'number' && Number.isFinite(aqi) ? String(aqi) : '?';
}

export function formatStationTime(value?: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

function parseStationTimestamp(value?: string): number | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.getTime();
}

export function normalizeWaqiStation(
  station: WaqiMapStation,
  index: number
): AirQualityStation | null {
  const aqi = parseAqi(station.aqi);
  const lat = toFiniteNumber(station.lat);
  const lon = toFiniteNumber(station.lon);
  if (aqi === null || lat === null || lon === null) return null;

  const name = station.station?.name?.trim() || `Station ${index + 1}`;
  const uid = station.uid ?? `${lat.toFixed(5)}-${lon.toFixed(5)}-${index}`;

  return {
    id: `waqi-${uid}`,
    name,
    lat,
    lon,
    aqi,
    category: getAqiCategory(aqi),
    updatedAt: formatStationTime(station.station?.time),
    updatedAtTimestamp: parseStationTimestamp(station.station?.time),
    source: 'WAQI',
  };
}

export function normalizeWaqiStations(raw: unknown): AirQualityStation[] {
  if (
    !raw ||
    typeof raw !== 'object' ||
    !Array.isArray((raw as { data?: unknown }).data)
  ) {
    return [];
  }

  return (raw as { data: WaqiMapStation[] }).data
    .map((station, index) => normalizeWaqiStation(station, index))
    .filter((station): station is AirQualityStation => station !== null);
}

export function calculatePollutantAqi(
  measurement: PollutantMeasurement
): number | null {
  const parameter = normalizeParameter(measurement.parameter);
  const breakpoints = EPA_AQI_BREAKPOINTS[parameter];
  if (!breakpoints || !Number.isFinite(measurement.value)) return null;

  const unit = measurement.unit?.toLowerCase() || '';
  if (
    (parameter === 'pm25' || parameter === 'pm10') &&
    unit &&
    !unit.includes('µg') &&
    !unit.includes('ug')
  ) {
    return null;
  }

  const concentration = truncateForAqi(parameter, measurement.value);
  const breakpoint =
    breakpoints.find(
      (bp) => concentration >= bp.cLow && concentration <= bp.cHigh
    ) || breakpoints[breakpoints.length - 1];

  if (concentration > breakpoint.cHigh) return breakpoint.iHigh;

  const aqi =
    ((breakpoint.iHigh - breakpoint.iLow) /
      (breakpoint.cHigh - breakpoint.cLow)) *
      (concentration - breakpoint.cLow) +
    breakpoint.iLow;

  return Math.round(aqi);
}

export function calculateOverallEstimatedAqi(
  measurements: PollutantMeasurement[]
): number | null {
  const aqis = measurements
    .map((measurement) => calculatePollutantAqi(measurement))
    .filter((aqi): aqi is number => aqi !== null);

  if (!aqis.length) return null;
  return Math.max(...aqis);
}
