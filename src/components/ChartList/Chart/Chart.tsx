import { useEffect, useState, useRef } from "react";
import Plot from "react-plotly.js";
import { LatestResult, Country } from "../../../react-app-env";
import { Layout, PlotData } from "plotly.js";
import ChartFunction from "./ChartFunction";

type Props = {
  chart: string;
  locations: LatestResult[];
  country: string;
  countriesList: Country[];
};

const Chart: React.FC<Props> = ({ chart, locations }) => {
  const [data, setData] = useState<Partial<PlotData>[]>([]);
  const [layout, setLayout] = useState<Partial<Layout>>({});
  const [revision, setRevision] = useState<number>(0);

  const {
    calculateBigChart,
    calculateBigLayout,
    calculateAverageChart,
    calculateAverageLayout,
    calculateMapChart,
    calculateMapLayout,
  } = ChartFunction();

  // We'll track the previous chart type to detect changes from map to scatter/bar
  const previousChartRef = useRef(chart);
  // plotKey used only if we want to force remount when leaving map view
  const [plotKey, setPlotKey] = useState("initial-plot");

  useEffect(() => {
    // Check if we are moving from map (3) to scatter or average (1 or 2)
    if (previousChartRef.current === "3" && chart !== "3") {
      // Force a remount by changing the key
      setPlotKey(`remount-${Date.now()}`);
    }
    previousChartRef.current = chart;
  }, [chart]);

  useEffect(() => {
    if (!locations || locations.length === 0) {
      setData([]);
      setLayout({});
      return;
    }

    let dataCalculation: Partial<PlotData>[] = [];
    let layoutCalculation: Partial<Layout> = {};

    if (chart === "1") {
      // Scatter chart scenario
      dataCalculation = calculateBigChart(chart, locations);
      layoutCalculation = calculateBigLayout(chart, locations);
    } else if (chart === "2") {
      // Bar chart scenario
      const { data: averageData, averages } = calculateAverageChart(locations);
      dataCalculation = averageData;
      layoutCalculation = calculateAverageLayout(averages);
    } else if (chart === "3") {
      // Map chart scenario
      dataCalculation = calculateMapChart(locations);

      let center = { lat: 51.1657, lon: 10.4515 };
      if (locations.length > 0) {
        let latSum = 0;
        let lonSum = 0;
        let count = 0;
        for (const loc of locations) {
          if (loc.coordinates) {
            latSum += loc.coordinates.latitude;
            lonSum += loc.coordinates.longitude;
            count++;
          }
        }
        if (count > 0) {
          center = { lat: latSum / count, lon: lonSum / count };
        }
      }

      layoutCalculation = calculateMapLayout(center);
    }

    // Add transitions
    layoutCalculation.transition = {
      duration: 200,
      easing: "cubic-in-out",
      ordering: "traces first",
    };

    setData(dataCalculation);
    setLayout(layoutCalculation);

    // Increment revision to apply transitions
    setRevision((prev) => prev + 1);
  }, [locations, chart]);

  const plotConfig: Partial<Plotly.Config> = {
    responsive: true,
  };

  if (chart === "3") {
    // Only include map token when in map view
    plotConfig.mapboxAccessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
  }

  return (
    <div style={{ width: "100%", height: "100%" }}>
      {data && data.length > 0 ? (
        <Plot
          key={plotKey} // Key changes only when leaving map view
          data={data}
          layout={layout}
          revision={revision}
          style={{ width: "100%", height: "100%" }}
          useResizeHandler={true}
          config={plotConfig}
        />
      ) : (
        <div>No data available to display the chart.</div>
      )}
    </div>
  );
};

export default Chart;
