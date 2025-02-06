import { Layout, PlotData } from 'plotly.js';

/**
 * Creates a single scatter trace with station names on X, AQI on Y.
 */
export function calculateBigChart(
  chart: string,
  locations: any[]
): Partial<PlotData>[] {
  if (!locations || !locations.length) return [];

  const xNames: string[] = [];
  const yAqi: number[] = [];
  const hoverTexts: string[] = [];
  const markerColors: string[] = [];

  locations.forEach((loc, i) => {
    const stationName = loc.station?.name || `Station #${i + 1}`;
    const aqiNum = parseInt(loc.aqi, 10);
    if (isNaN(aqiNum) || aqiNum < 0) return;

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

/**
 * Layout with a y-axis up to ~500 for AQI (since AQI often caps at 500).
 */
export function calculateBigLayout(
  chart: string,
  locations: any[],
  width: number,
  height: number
): Partial<Layout> {
  return {
    width: width - 40,
    height: height - 45,
    title: `AQI from ${locations.length} Stations`,
    xaxis: {
      title: 'Station',
      automargin: true,
    },
    yaxis: {
      title: 'AQI',
      range: [0, 500],
    },
    margin: { l: 60, r: 10, t: 80, b: 80 },
    legend: { x: 0, y: 1, font: { size: 15 }, yanchor: 'top', xanchor: 'left' },
    hovermode: 'closest',
  };
}

/**
 * Existing aqiColor function or import from your chartUtilsHelpers.
 */
export function aqiColor(aqi: number): string {
  if (aqi <= 50) return '#009966'; // Good
  if (aqi <= 100) return '#ffde33'; // Moderate
  if (aqi <= 150) return '#ff9933'; // USG
  if (aqi <= 200) return '#cc0033'; // Unhealthy
  if (aqi <= 300) return '#660099'; // Very Unhealthy
  return '#7e0023'; // Hazardous
}

/**
 * @function calculateAverageChart
 * @desc Given an array of location data (each with `aqi`), compute the overall average.
 * Returns a single-bar dataset for the mini chart and the maxVal for adjusting the chart range.
 */
export function calculateAverageChart(allData: any[]) {
  const validAqis = allData
    .map((d) => parseInt(d.aqi, 10))
    .filter((num) => !isNaN(num) && num >= 0);

  if (!validAqis.length) {
    return { data: [], maxVal: 0 };
  }

  // Compute the average
  const avg = validAqis.reduce((sum, val) => sum + val, 0) / validAqis.length;

  return {
    data: [{ aqi: avg }],
    maxVal: avg,
  };
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
