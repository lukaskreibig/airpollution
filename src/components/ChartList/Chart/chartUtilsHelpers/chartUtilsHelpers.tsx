/**
 * @file chartUtilsHelpers.ts
 */
import { useEffect, useState } from 'react';

export function aqiColor(aqi: number) {
  if (aqi <= 50) return '#009966';
  if (aqi <= 100) return '#ffde33';
  if (aqi <= 150) return '#ff9933';
  if (aqi <= 200) return '#cc0033';
  if (aqi <= 300) return '#660099';
  return '#7e0023';
}

export const AQI_BREAKPOINTS = [
  { value: 50, label: 'Good' },
  { value: 100, label: 'Moderate' },
  { value: 150, label: 'Unhealthy for Sensitive Groups' },
  { value: 200, label: 'Unhealthy' },
  { value: 300, label: 'Very Unhealthy' },
  { value: 500, label: 'Hazardous' }, // or 300+ => Hazardous
];

// Possibly your window dimension hook
export function useWindowDimensions() {
  const [dim, setDim] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  useEffect(() => {
    function onResize() {
      setDim({ width: window.innerWidth, height: window.innerHeight });
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return dim;
}
