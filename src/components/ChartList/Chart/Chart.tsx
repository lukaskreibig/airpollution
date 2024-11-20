// In Chart.tsx

import { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { animated, useSpring } from "react-spring";
import ChartFunction from "./ChartFunction";

type Props = {
  chart: string;
  locations: LatestResult[];
};

const Chart: React.FC<Props> = ({ chart, locations }) => {
  const [data, setData] = useState<any[]>([]);
  const [layout, setLayout] = useState<any>({});

  const { calculateBigChart, calculateBigLayout } = ChartFunction();

  useEffect(() => {
    const dataCalculation = calculateBigChart(chart, locations);
    const layoutCalculation = calculateBigLayout(chart, locations);

    setData(dataCalculation);
    setLayout(layoutCalculation);
  }, [locations, chart]);

  const style = useSpring({ from: { y: 50 }, to: { y: 0 } });

  return (
    <animated.div style={style}>
      <Plot data={data} layout={layout} />
    </animated.div>
  );
};

export default Chart;
