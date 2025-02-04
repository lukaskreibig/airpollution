/**
 * @file chartUtilsHelpers.ts
 * @desc Contains shared helpers for the Chart component: color function, dimension hooks, etc.
 */
import { useEffect, useState } from 'react';

/**
 * Initial map center coords.
 */
export const INITIAL_CENTER: [number, number] = [-74.0242, 40.6941];

/**
 * Initial map zoom.
 */
export const INITIAL_ZOOM = 10.12;

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

/**
 * Returns the color associated with a given AQI value.
 * @param {number} aqi - Air Quality Index value
 * @returns {string} - Color code
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
 * Checks if a measurement is valid.
 * @param {any} measurement - Measurement object
 * @returns {boolean} - True if valid, false otherwise
 */
export function isValidMeasurement(measurement: any): boolean {
  return measurement != null && !isNaN(measurement.value);
}
