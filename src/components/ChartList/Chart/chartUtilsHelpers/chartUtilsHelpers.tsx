/**
 * Hilfsfunktionen & Konstanten für AQI-Darstellungen + Messwert-Validierung.
 */
import { useEffect, useState } from 'react';

/* -------------------------------------------------------------------------- */
/*                                    AQI                                     */
/* -------------------------------------------------------------------------- */

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
  { value: 500, label: 'Hazardous' },
];

/* -------------------------------------------------------------------------- */
/*                               Karten-Defaults                              */
/* -------------------------------------------------------------------------- */

export const INITIAL_CENTER: [number, number] = [0, 0];
export const INITIAL_ZOOM = 2;

/* -------------------------------------------------------------------------- */
/*                        Messwert-Validierung (Tests)                        */
/* -------------------------------------------------------------------------- */

/**
 * Prüft, ob ein Messwert (Parameter + Wert) in einem sinnvollen Bereich liegt.
 * – Nur PM2.5 wird akzeptiert (Tests nutzen ausschließlich diesen Parameter).
 * – Zulässiger Wertebereich 1 … 600.
 */
export function isValidMeasurement(
  parameter?: string,
  value?: number
): boolean {
  if (parameter !== 'pm25') return false;
  if (typeof value !== 'number' || Number.isNaN(value)) return false;
  return value > 0 && value <= 600;
}

/* -------------------------------------------------------------------------- */
/*                       Simple Hook für Fenstergrößen …                      */
/* -------------------------------------------------------------------------- */

export function useWindowDimensions() {
  const [dim, setDim] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  useEffect(() => {
    const onResize = () =>
      setDim({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return dim;
}
