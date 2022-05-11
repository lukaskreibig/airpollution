import { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { animated, useSpring } from "react-spring";
import ChartFunction from "./ChartFunction";

type Props = {
  average: results;
  chart: string;
  locations: results;
};
const Chart: React.FC<Props> = ({ average, chart, locations }) => {
  
  const [data, setData] = useState([])
  const [layout, setLayout] = useState({})

  const {
    calculateBarChart,
    calculateBigChart,
    calculateBarLayout,
    calculateBigLayout,
  } = ChartFunction();




  useEffect(() => {
    let dataCalculation:any
    chart === "2" ? dataCalculation = calculateBarChart(average) : dataCalculation = calculateBigChart(chart, locations)
   
    let layoutCalculation:any
    chart === "2" ? layoutCalculation = calculateBarLayout(average) : layoutCalculation = calculateBigLayout(chart, locations)
    
    setData(dataCalculation)
    setLayout(layoutCalculation)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [average, chart, locations]);
  



  /**
   * react-spring chart animation when reloading or changing the chart data
   * <p>
   *
   * react-spring will animate the chart from y:50 to y:0 (bounce up and down) whenever there is a change
   * in the passed down variable data, which contains the Plotly Settings and will change whenever the
   * App is being loaded or the Chart is changed.
   *
   * @author Lukas Kreibig
   * @param objectvalues { x: 0, y: 50, opacity: 0.1} useSpring start settings for first and rerender render
   * @param data react-spring will listen to the variable data and animate the object values whenever there is a change
   */

  const [style, api] = useSpring({ x: 0, y: 50}, [chart]);
  useEffect(() => {
    api.start({
      x: 0,
      y: 0,
      delay: 150,
      config: { mass: 1, tension: 280, friction: 60 },
    });
  }, [chart, api]);

  return (
    <animated.div style={style}>
      <Plot data={data} layout={layout} />
    </animated.div>
  );
};

export default Chart;
