import { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import ChartFunction from "./ChartFunction";
import { LatestResult, Country } from "../../../react-app-env";
import { Layout, PlotData } from "plotly.js";

type Props = {
  chart: string;
  locations: LatestResult[];
  country: string;
  countriesList: Country[];
};

const Chart: React.FC<Props> = ({ chart, locations, country, countriesList }) => {
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

  useEffect(() => {
    let dataCalculation: Partial<PlotData>[] = [];
    let layoutCalculation: Partial<Layout> = {};

    if (chart === "1") {
      dataCalculation = calculateBigChart(chart, locations);
      layoutCalculation = calculateBigLayout(chart, locations);
    } else if (chart === "2") {
      // Handle empty locations
      if (locations.length > 0) {
        const { data: averageData, averages } = calculateAverageChart(locations);
        dataCalculation = averageData;
        layoutCalculation = calculateAverageLayout(averages);
      } else {
        // Default averages when no data is available
        const defaultAverages = [
          { parameter: "PM10", average: 0, guideline: 45 },
          { parameter: "PM2.5", average: 0, guideline: 15 },
        ];
        dataCalculation = [
          {
            x: defaultAverages.map((a) => a.parameter),
            y: defaultAverages.map((a) => a.average),
            type: "bar",
            name: "Average",
            marker: {
              color: "#2a9d8f",
            },
            text: defaultAverages.map((a) => a.average.toFixed(2) + " µg/m³"),
            textposition: "auto",
            hoverinfo: "x+y",
          },
        ];
        layoutCalculation = calculateAverageLayout(defaultAverages);
      }
    } else if (chart === "3") {
      dataCalculation = calculateMapChart(locations);

      // Calculate map center based on locations
      let center = { lat: 51.1657, lon: 10.4515 }; // Default to Germany
      if (locations.length > 0) {
        let latSum = 0;
        let lonSum = 0;
        let count = 0;
        locations.forEach((loc) => {
          if (loc.coordinates) {
            latSum += loc.coordinates.latitude;
            lonSum += loc.coordinates.longitude;
            count += 1;
          }
        });
        if (count > 0) {
          center = {
            lat: latSum / count,
            lon: lonSum / count,
          };
        }
      }

      layoutCalculation = calculateMapLayout(center);
    }

    // Add transition settings to layout
    layoutCalculation.transition = {
      duration: 200,
      easing: "cubic-in-out",
      ordering: "traces first",
    };

    setData(dataCalculation);
    setLayout(layoutCalculation);
    setRevision((prev) => prev + 1);
  }, [locations, chart]);

  return (
    <div>
      {data.length > 0 ? (
        <Plot
          data={data}
          layout={layout}
          revision={revision}
          config={{
            responsive: true,
            mapboxAccessToken: process.env.REACT_APP_MAPBOX_ACCESS_TOKEN,
          }}
        />
      ) : (
        <div>Loading data...</div>
      )}
    </div>
  );
};

export default Chart;
