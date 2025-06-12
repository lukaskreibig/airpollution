import { Layout, PlotData } from 'plotly.js';
import { aqiColor } from './chartUtilsHelpers/chartUtilsHelpers';

/* ---------- Typen ---------- */
export interface ProcessedLocation {
  lat: number;
  lon: number;
  aqi: number;
  popupHTML: string;
  name?: string;
}

/* ---------- Scatter-Chart ---------- */
export function calculateBigChart(
  _chart: string,
  locations: any[]
): Partial<PlotData>[] {
  if (!locations?.length) return [];

  const xNames: string[] = [];
  const yAqi: number[] = [];
  const hoverTexts: string[] = [];
  const markerColors: string[] = [];

  locations.forEach((loc, i) => {
    const stationName = loc.station?.name || `Station #${i + 1}`;
    const aqiNum = parseInt(loc.aqi, 10);
    if (Number.isNaN(aqiNum) || aqiNum < 0) return;

    xNames.push(stationName);
    yAqi.push(aqiNum);
    hoverTexts.push(`${stationName}<br>AQI: ${aqiNum}`);
    markerColors.push(aqiColor(aqiNum));
  });

  if (!xNames.length) return [];

  return [
    {
      type: 'scatter',
      mode: 'markers',
      y: yAqi,
      x: xNames,
      text: hoverTexts,
      hoverinfo: 'text',
      marker: {
        color: markerColors,
        size: 12,
        line: { color: '#000', width: 1 },
      },
      name: 'Stations AQI',
    },
  ];
}

/* ---------- Layout-Generator ---------- */
export function calculateBigLayout(
  _chart: string,
  locations: any[],
  width: number,
  height: number
): Partial<Layout> {
  return {
    width: width - 40,
    height: height - 45,
    title: { text: `AQI from ${locations.length} Stations` },
    yaxis: { title: 'AQI', range: [0, 500] },
    margin: { l: 60, r: 10, t: 80, b: 80 },
    legend: { x: 0, y: 1, font: { size: 15 }, yanchor: 'top', xanchor: 'left' },
    hovermode: 'closest',
    xaxis: {
      showgrid: false,
      showline: false,
      showticklabels: false,
    },
  };
}

/* ---------- Mini-Chart-Utils ---------- */
export function calculateAverageChart(allData: any[]) {
  const validAqis = allData
    .map((d) => parseInt(d.aqi, 10))
    .filter((num) => Number.isFinite(num) && num >= 0);

  if (!validAqis.length) return { data: [], maxVal: 0 };

  const avg = validAqis.reduce((sum, val) => sum + val, 0) / validAqis.length;

  return { data: [{ aqi: avg }], maxVal: avg };
}

export function calculateAverageLayout(maxVal: number): Partial<Layout> {
  let upper = Math.min(Math.max(maxVal * 1.2, 50), 500);
  return {
    width: 600,
    height: 300,
    title: { text: 'AQI Pollutant Averages' },
    xaxis: { title: 'Pollutants & Overall' },
    yaxis: { title: 'AQI', range: [0, upper] },
    margin: { l: 40, r: 20, t: 50, b: 40 },
  };
}
