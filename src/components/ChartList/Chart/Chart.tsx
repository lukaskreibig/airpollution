import { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { animated, useSpring } from "react-spring";
import ChartFunction from "./ChartFunction";
import { LatestResult } from "../../../react-app-env";
import { Layout, PlotData } from "plotly.js";

type Props = {
  chart: string;
  locations: LatestResult[];
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
    }

    // Add transition settings to layout
    layoutCalculation.transition = {
      duration: 500,
      easing: "cubic-in-out",
    };

    setData(dataCalculation);
    setLayout(layoutCalculation);
    setRevision((prev) => prev + 1);
  }, [locations, chart]);

  const style = useSpring({ from: { y: 50 }, to: { y: 0 } });

  return (
    <animated.div style={style}>
      {data.length > 0 ? (
        <Plot
          data={data}
          layout={layout}
          revision={revision}
          config={{ responsive: true }}
        />
      ) : (
        <div>Loading data...</div>
      )}
    </animated.div>
  );
};

export default Chart;
