import { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { animated, useSpring } from "react-spring";
import ChartFunction from "./ChartFunction";
import { PlotData, Layout } from "plotly.js";
import { LatestResult } from "../../../react-app-env";

type Props = {
  chart: string;
  locations: LatestResult[];
};

const Chart: React.FC<Props> = ({ chart, locations }) => {
  const [data, setData] = useState<Partial<PlotData>[]>([]);
  const [layout, setLayout] = useState<Partial<Layout>>({});

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
