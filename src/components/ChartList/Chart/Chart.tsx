import { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { animated, useSpring } from "react-spring";
import ChartFunction from "./ChartFunction";
import { LatestResult } from "../../../react-app-env";

type Props = {
  chart: string;
  locations: LatestResult[];
};

const Chart: React.FC<Props> = ({ chart, locations }) => {
  const [data, setData] = useState<any>([]);
  const [layout, setLayout] = useState<any>({});

  const {
    calculateBigChart,
    calculateBigLayout,
    calculateAverageChart,
    calculateAverageLayout,
  } = ChartFunction();

  useEffect(() => {
    let dataCalculation;
    let layoutCalculation;

    if (chart === "1") {
      dataCalculation = calculateBigChart(chart, locations);
      layoutCalculation = calculateBigLayout(chart, locations);
    } else if (chart === "2") {
      // Destructure data and averages from calculateAverageChart
      const { data: averageData, averages } = calculateAverageChart(locations);
      dataCalculation = averageData;
      layoutCalculation = calculateAverageLayout(averages);
    }

    setData(dataCalculation);
    setLayout(layoutCalculation);
  }, [locations, chart]);

  const style = useSpring({ from: { y: 50 }, to: { y: 0 } });

  return (
    <animated.div style={style}>
      <Plot data={data} layout={layout} config={{ responsive: true }} />
    </animated.div>
  );
};

export default Chart;
