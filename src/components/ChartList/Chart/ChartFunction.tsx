import { Layout, PlotData } from 'plotly.js';
import { LatestResult } from '../../../react-app-env';

/**
 * **AQI Breakpoints based on EPA-Guidelines**
 */
const AQI_BREAKPOINTS: Record<
  string,
  Array<{ cLow: number; cHigh: number; iLow: number; iHigh: number }>
> = {
  pm25: [
    { cLow: 0.0, cHigh: 12.0, iLow: 0, iHigh: 50 },
    { cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
    { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
    { cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200 },
    { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
    { cLow: 250.5, cHigh: 350.4, iLow: 301, iHigh: 400 },
    { cLow: 350.5, cHigh: 500.4, iLow: 401, iHigh: 500 },
  ],
  pm10: [
    { cLow: 0, cHigh: 54, iLow: 0, iHigh: 50 },
    { cLow: 55, cHigh: 154, iLow: 51, iHigh: 100 },
    { cLow: 155, cHigh: 254, iLow: 101, iHigh: 150 },
    { cLow: 255, cHigh: 354, iLow: 151, iHigh: 200 },
    { cLow: 355, cHigh: 424, iLow: 201, iHigh: 300 },
    { cLow: 425, cHigh: 504, iLow: 301, iHigh: 400 },
    { cLow: 505, cHigh: 604, iLow: 401, iHigh: 500 },
  ],
  o3: [
    // o3_8h in ChartFunction
    { cLow: 0.0, cHigh: 0.054, iLow: 0, iHigh: 50 },
    { cLow: 0.055, cHigh: 0.07, iLow: 51, iHigh: 100 },
    { cLow: 0.071, cHigh: 0.085, iLow: 101, iHigh: 150 },
    { cLow: 0.086, cHigh: 0.105, iLow: 151, iHigh: 200 },
    { cLow: 0.106, cHigh: 0.2, iLow: 201, iHigh: 300 },
  ],
  co: [
    { cLow: 0.0, cHigh: 4.4, iLow: 0, iHigh: 50 },
    { cLow: 4.5, cHigh: 9.4, iLow: 51, iHigh: 100 },
    { cLow: 9.5, cHigh: 12.4, iLow: 101, iHigh: 150 },
    { cLow: 12.5, cHigh: 15.4, iLow: 151, iHigh: 200 },
    { cLow: 15.5, cHigh: 30.4, iLow: 201, iHigh: 300 },
    { cLow: 30.5, cHigh: 40.4, iLow: 301, iHigh: 400 },
    { cLow: 40.5, cHigh: 50.4, iLow: 401, iHigh: 500 },
  ],
  so2: [
    { cLow: 0, cHigh: 35, iLow: 0, iHigh: 50 },
    { cLow: 36, cHigh: 75, iLow: 51, iHigh: 100 },
    { cLow: 76, cHigh: 185, iLow: 101, iHigh: 150 },
    { cLow: 186, cHigh: 304, iLow: 151, iHigh: 200 },
    { cLow: 305, cHigh: 604, iLow: 201, iHigh: 300 },
    { cLow: 605, cHigh: 804, iLow: 301, iHigh: 400 },
    { cLow: 805, cHigh: 1004, iLow: 401, iHigh: 500 },
  ],
  no2: [
    { cLow: 0, cHigh: 53, iLow: 0, iHigh: 50 },
    { cLow: 54, cHigh: 100, iLow: 51, iHigh: 100 },
    { cLow: 101, cHigh: 360, iLow: 101, iHigh: 150 },
    { cLow: 361, cHigh: 649, iLow: 151, iHigh: 200 },
    { cLow: 650, cHigh: 1249, iLow: 201, iHigh: 300 },
    { cLow: 1250, cHigh: 1649, iLow: 301, iHigh: 400 },
    { cLow: 1650, cHigh: 2049, iLow: 401, iHigh: 500 },
  ],
};

function truncateValue(param: string, value: number): number {
  const p = param.toLowerCase();
  if (p === 'o3') return Math.floor(value * 1000) / 1000; // truncate to 3 decimals
  if (p === 'pm25') return Math.floor(value * 10) / 10; // 1 decimal
  if (p === 'pm10') return Math.floor(value); // integer
  if (p === 'co') return Math.floor(value * 10) / 10; // 1 decimal
  if (p === 'so2' || p === 'no2') return Math.floor(value); // integer
  return value;
}

export function computeSubAqi(param: string, val: number): number {
  const pollutant = param.toLowerCase();
  const breakpoints = AQI_BREAKPOINTS[pollutant];
  if (!breakpoints) return -1;

  // Truncate value according to rules
  const c = truncateValue(pollutant, val);

  // Find the breakpoint interval
  let chosenBp = null;
  for (const bp of breakpoints) {
    if (c >= bp.cLow && c <= bp.cHigh) {
      chosenBp = bp;
      break;
    }
  }

  // If above last breakpoint
  if (!chosenBp) {
    const lastBp = breakpoints[breakpoints.length - 1];
    if (c > lastBp.cHigh) {
      return 500; // max AQI
    }
    return -1;
  }

  const { cLow, cHigh, iLow, iHigh } = chosenBp;

  // Equation 1:
  // Ip = (IHi - ILo)/(CHi - CLo) * (Cp - CLo) + ILo
  const Ip = ((iHigh - iLow) / (cHigh - cLow)) * (c - cLow) + iLow;

  // Round to nearest integer
  return Math.round(Ip);
}

export function computeAqiForPollutant(param: string, val: number): number {
  return computeSubAqi(param, val);
}

/**
 * Calculates overall AQI as a maximum from the Part-AQI-Value.
 */
export function computeOverallAqi(params: Record<string, number>): number {
  let maxAqi = -1;
  for (const [p, v] of Object.entries(params)) {
    const sub = computeSubAqi(p, v);
    if (sub > maxAqi) {
      maxAqi = sub;
    }
  }
  return maxAqi;
}

/**
 * OLD scatter chart logic (Chart=1).
 * Accepts raw LatestResult[], returns PlotData[] for PM2.5 & PM10.
 */

const WHO_PM25_GUIDELINE = 15;
const WHO_PM10_GUIDELINE = 45;

export function calculateBigChart(
  chart: string,
  locations: LatestResult[]
): Partial<PlotData>[] {
  if (!locations || !locations.length) return [];

  const parameters = [
    {
      name: 'PM10 µg/m³',
      value: 'pm10',
      min: 0,
      max: 1500,
      guideline: WHO_PM10_GUIDELINE,
    },
    {
      name: 'PM2.5 µg/m³',
      value: 'pm25',
      min: 0,
      max: 800,
      guideline: WHO_PM25_GUIDELINE,
    },
  ];

  const colors = ['#e9c46a', '#2a9d8f'];
  const traces: Partial<PlotData>[] = [];
  const xValues = locations.map((_, idx) => idx);

  parameters.forEach((para, index) => {
    const xWithin: number[] = [];
    const yWithin: number[] = [];
    const hoverWithin: string[] = [];

    const xExceed: number[] = [];
    const yExceed: number[] = [];
    const hoverExceed: string[] = [];

    locations.forEach((loc, idx2) => {
      const measurement = loc.measurements.find(
        (m) => m.parameter === para.value
      );
      if (!measurement) return;
      if (measurement.value <= 0) return; // skip negative
      if (measurement.value >= para.min && measurement.value <= para.max) {
        const value = measurement.value;
        const locationName = loc.location + (loc.city ? `, ${loc.city}` : '');
        const hoverText = `${locationName}<br>${para.name}: ${value.toFixed(2)} µg/m³${
          value > para.guideline
            ? ` (Exceeds WHO guideline of ${para.guideline} µg/m³)`
            : ''
        }`;
        if (value > para.guideline) {
          xExceed.push(idx2);
          yExceed.push(value);
          hoverExceed.push(hoverText);
        } else {
          xWithin.push(idx2);
          yWithin.push(value);
          hoverWithin.push(hoverText);
        }
      }
    });

    if (xWithin.length > 0) {
      traces.push({
        type: 'scatter',
        x: xWithin,
        y: yWithin,
        mode: 'markers',
        name: `${para.name} Within Guidelines`,
        marker: {
          color: colors[index],
          symbol: 'circle',
          size: 10,
          line: { color: '#000', width: 1 },
        },
        text: hoverWithin,
        hoverinfo: 'text',
        showlegend: true,
      });
    }
    if (xExceed.length > 0) {
      traces.push({
        type: 'scatter',
        x: xExceed,
        y: yExceed,
        mode: 'markers',
        name: `${para.name} Exceeds Guidelines`,
        marker: {
          color: colors[index],
          symbol: 'triangle-up',
          size: 10,
          line: { color: '#000', width: 1 },
        },
        text: hoverExceed,
        hoverinfo: 'text',
        showlegend: true,
      });
    }
    // WHO line
    traces.push({
      type: 'scatter',
      x: [0, xValues.length - 1],
      y: [para.guideline, para.guideline],
      mode: 'lines',
      name: `WHO Guideline (${para.name})`,
      line: {
        color: colors[index],
        dash: 'dash',
        width: 2,
      },
      hoverinfo: 'none',
      showlegend: true,
    });
  });

  return traces;
}

export function calculateBigLayout(
  chart: string,
  locations: LatestResult[],
  width: number,
  height: number
): Partial<Layout> {
  return {
    width: width - 40,
    height: height - 45,
    title: `Air Pollution - from ${locations.length} Stations`,
    xaxis: {
      showgrid: false,
      showline: false,
      showticklabels: false,
    },
    yaxis: {
      title: 'Concentration (µg/m³)',
    },
    margin: { l: 60, r: 10, t: 80, b: 40 },
    legend: { x: 0, y: 1, font: { size: 15 }, yanchor: 'top', xanchor: 'left' },
    hovermode: 'closest',
  };
}

export interface ProcessedLocation {
  name: string;
  city?: string;
  lat: number;
  lon: number;
  parameters: Record<string, number>;
  timestamp?: string;
  popupHTML: string;
}

const POLLUTANTS_TO_AVG = ['pm25', 'pm10', 'o3', 'co', 'so2', 'no2'];

/**
 * Defines the color of the diagrams.
 */
function barAqiColor(aqi: number): string {
  if (aqi < 0) return '#bfbfbf';
  if (aqi <= 50) return '#2a9d8f';
  if (aqi <= 100) return '#e9c46a';
  if (aqi <= 150) return '#f4a261';
  if (aqi <= 200) return '#d62828';
  return '#9d0208';
}

/**
 * Calculates the Average-AQI for the diagrams.
 */
export function calculateAverageChart(processedLocs: ProcessedLocation[]): {
  data: Partial<PlotData>[];
  maxVal: number;
} {
  if (!processedLocs.length) return { data: [], maxVal: 500 };

  let sum: Record<string, number> = {};
  let count: Record<string, number> = {};
  POLLUTANTS_TO_AVG.forEach((p) => {
    sum[p] = 0;
    count[p] = 0;
  });

  let overallSum = 0,
    overallCount = 0;
  processedLocs.forEach((loc) => {
    const subAqis: number[] = [];
    for (const [p, v] of Object.entries(loc.parameters)) {
      if (!POLLUTANTS_TO_AVG.includes(p)) continue;
      const sub = computeSubAqi(p, v);
      if (sub >= 0) {
        subAqis.push(sub);
        sum[p] += sub;
        count[p]++;
      }
    }
    if (subAqis.length > 0) {
      const locOverall = Math.max(...subAqis);
      overallSum += locOverall;
      overallCount++;
    }
  });

  const xLabels: string[] = [];
  const yValues: number[] = [];
  const barColors: string[] = [];
  let maxVal = 0;

  POLLUTANTS_TO_AVG.forEach((p) => {
    if (count[p] === 0) {
      xLabels.push(p.toUpperCase());
      yValues.push(0);
      barColors.push('#bfbfbf');
    } else {
      const avg = sum[p] / count[p];
      xLabels.push(p.toUpperCase());
      yValues.push(avg);
      barColors.push(barAqiColor(avg));
      if (avg > maxVal) maxVal = avg;
    }
  });

  let overallAvg = -1;
  if (overallCount > 0) {
    overallAvg = overallSum / overallCount;
  }
  xLabels.push('Overall');
  const finalVal = overallAvg < 0 ? 0 : overallAvg;
  yValues.push(finalVal);
  barColors.push(finalVal <= 0 ? '#bfbfbf' : barAqiColor(finalVal));
  if (finalVal > maxVal) maxVal = finalVal;

  const barTrace: Partial<PlotData> = {
    x: xLabels,
    y: yValues,
    type: 'bar',
    marker: { color: barColors },
    text: yValues.map((v) => (v > 0 ? v.toFixed(1) : '?')),
    textposition: 'auto',
    hoverinfo: 'y',
  };

  return { data: [barTrace], maxVal };
}

export function calculateAverageLayout(maxVal: number): Partial<Layout> {
  let upper = maxVal * 1.2;
  if (upper < 50) upper = 50;
  if (upper > 500) upper = 500;
  return {
    width: 600,
    height: 300,
    title: 'AQI Pollutant Averages',
    xaxis: { title: 'Pollutants & Overall' },
    yaxis: { title: 'AQI', range: [0, upper] },
    margin: { l: 40, r: 20, t: 50, b: 40 },
  };
}
