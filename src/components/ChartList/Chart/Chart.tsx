import { blue, red } from "@mui/material/colors";
import { useEffect } from "react";
import Plot from "react-plotly.js";
import { animated, useSpring } from "react-spring";
import "../../../App.css";
import ChartFunction from "./ChartFunction";

type Props = {
  average: results;
  dataPoints: number;
  chart: number;
  locations: results;
};
const Chart: React.FC<Props> = ({ average, dataPoints, chart, locations }) => {
  
  const {
    calculateBarChart,
    calculateBigChart,
    calculateBarLayout,
    calculateBigLayout,
  } = ChartFunction();
  

  let data: any =
    chart === 2
      ? calculateBarChart(average)
      : calculateBigChart(chart, locations);
  let layout: any =
    chart === 2
      ? calculateBarLayout(average)
      : calculateBigLayout(chart, dataPoints, locations);


  // let config = { responsive: true };

  /**
   * react-spring chart animation when reloading or changing the chart data
   * <p>
   *
   * react-spring will animate the chart from y:50 to y:0 (bounce up and down) whenever there is a change
   * in the passed down variable data, which contains the Plotly Settings and will change whenever the
   * App is being loaded or the Chart is changed.
   *
   * @author Lukas Kreibig
   * @param data react-spring will listen to the variable data and animate whenever there is a change
   */

  const [style, api] = useSpring({ x: 0, y: 50, opacity: 0.4}, [data]);
  useEffect(() => {
    api.start({
      x: 0,
      y: 0,
      opacity: 1,
      delay: 150,
      config: { mass: 1, tension: 280, friction: 60 },
    });
  }, [data, api]);

  return (
    <animated.div style={style}>
      <Plot data={data} layout={layout} />
    </animated.div>
  );
};

export default Chart;
