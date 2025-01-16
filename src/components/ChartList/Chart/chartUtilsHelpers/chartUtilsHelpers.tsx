/**
 * @file chartUtilsHelpers.ts
 * @desc Contains shared helpers for the Chart component: color function, dimension hooks, etc.
 */
import { useEffect, useState } from 'react';

/**
 * The set of ALLOWED_PARAMS relevant for AQI calculations.
 */
export const ALLOWED_PARAMS = new Set([
  'o3',
  'pm25',
  'pm10',
  'so2',
  'no2',
  'co',
]);

/**
 * Initial map center coords.
 */
export const INITIAL_CENTER: [number, number] = [-74.0242, 40.6941];

/**
 * Initial map zoom.
 */
export const INITIAL_ZOOM = 10.12;

/**
 * Returns the AQI color for a given numeric value.
 * @param {number} aqi - AQI value
 * @returns {string} - CSS color hex
 */
export function aqiColor(aqi: number): string {
  if (aqi < 0) return '#bfbfbf';
  if (aqi <= 50) return '#2a9d8f';
  if (aqi <= 100) return '#e9c46a';
  if (aqi <= 150) return '#f4a261';
  if (aqi <= 200) return '#d62828';
  return '#9d0208';
}

/**
 * Checks if a given pollutant measurement is valid for AQI (param + value).
 * @param {string} param - Pollutant parameter
 * @param {number} value - Measurement value
 * @returns {boolean} - True if valid
 */
export function isValidMeasurement(param: string, value: number): boolean {
  if (!ALLOWED_PARAMS.has(param)) return false;
  if (value <= 0) return false;
  if (value > 600) return false;
  return true;
}

/**
 * Converts the given parameter if needed (o3 => divide by 2000, co => divide by 1145).
 * @param {string} parameter - Pollutant name
 * @param {number} rawValue - Measured value
 * @returns {number} - Possibly converted value
 */
export function convertIfNeeded(parameter: string, rawValue: number): number {
  if (parameter === 'o3') return rawValue / 2000;
  if (parameter === 'co') return rawValue / 1145;
  return rawValue;
}

/**
 * Truncates and converts measurement values for each pollutant param.
 * @param {string} parameter - Pollutant parameter
 * @param {number} val - Raw measured value
 * @returns {number} - Truncated/converted value
 */
export function truncateAndConvert(parameter: string, val: number): number {
  const cVal = convertIfNeeded(parameter.toLowerCase(), val);
  if (parameter === 'pm25') return Number(cVal.toFixed(1));
  if (parameter === 'pm10') return Math.floor(cVal);
  if (parameter === 'o3' || parameter === 'o3_8h')
    return Number(cVal.toFixed(3));
  if (parameter === 'co') return Number(cVal.toFixed(1));
  if (parameter === 'so2' || parameter === 'no2') return Math.floor(cVal);
  return cVal;
}

/**
 * Formats a date string with a German-locale approach for display.
 * @param {string} dateStr - Raw date string
 * @returns {string} - Formatted date string
 */
export function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    };
    return d.toLocaleString('de-DE', options);
  } catch {
    return dateStr;
  }
}

/**
 * Hook to track window dimensions and re-render on resize.
 * @returns {{width:number, height:number}} - Window dimensions
 */
export function useWindowDimensions() {
  const [dims, setDims] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () =>
      setDims({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return dims;
}
