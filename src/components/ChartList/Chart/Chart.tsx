import { useEffect } from "react";
import Plot from "react-plotly.js";
import { animated, useSpring } from "react-spring";
import "../../../App.css";

type Props = {
  average: results;
  dataPoints: number;
  chart: number;
  locations: results;
};
const Chart: React.FC<Props> = ({ average, dataPoints, chart, locations }) => {

  let color = ["#e9c46a", "#2a9d8f"];

  /**
   * Calculates The Plotly DATA Settings for Detailed / Latest Air Pollution Chart
   * <p>
   * The Function recieves the argument chart, which helps the function to decide which data is needed
   * according to the Dropdown Selection "Detailed Air Pollution Data" or "Average Air Pollution Data".
   * It maps out the according API Data into the Plotly Settings, so it can be passed down to the Plotly
   * component.
   *
   * @author Lukas Kreibig
   * @param chart The Chart Number recieved from the Dropdown Choice by User
   */

  const calculateBigChart = (chart:number) => {

    let parameter:parameter[] = [
      { name: "PM 10 µg/m³", value: "pm10" },
      { name: "PM 2.5 µg/m³", value: "pm25" },
    ];

    return parameter.map((para: parameter, index: number) => {
      return {
        type: "scatter",
        x: locations.map(
          (data: any) =>
            data.name +
            (data.city
              ? `, ${data.city}, Latest Update: ${data.lastUpdated.split("T")[0]}`
              : "")
        ),
        y: locations
          .map((data: any) =>
            data.parameters
              .filter((pm: any) => pm.parameter === para.value)
              .map((value: any) =>
                chart === 3 ? value.lastValue : value.average
              )
          )
          .flat(1),
        mode: "markers",
        name: para.name,
        marker: {
          color: color[index],
          line: {
            color: color[index],
            width: 1,
          },
          symbol: "circle",
          size: 10,
        },
      };
    });
  }

   /**
   * Calculates The Plotly DATA Settings for The Average Pollution Chart
   * <p>
   * 
   * It maps out the according API Data from the variable "average" which contains the Data
   * for the Bar Pollution Chart and inserts them in the Plotly Settings, so they can
   * be fed into the Plotly Component.
   *
   * @author Lukas Kreibig
   */

  const calculateBarChart = () => {
    return [
      {
        type: "bar",
        x: average.map((data: any) => data.displayName + " " + data.unit),
        y: average.map((data: any) => data.average),
        marker: { color: "#f4a261" },
      },
    ]
  }

  /**
   * Calculates The Plotly LAYOUT Settings for Detailed / Latest Air Pollution Chart
   * <p>
   * 
   * The Function recieves the argument chart, which helps the function to decide which data is needed
   * according to the Dropdown Selection "Detailed Air Pollution Data" or "Average Air Pollution Data".
   * It maps out the according API Data into the Plotly Layout Settings, 
   * so it can be passed down to the Plotly component.
   *
   * @author Lukas Kreibig
   * @param chart The Chart Number recieved from the Dropdown Choice by User
   */
  
  const calculateBigLayout = (chart:number) => {
    return {
      width: 1400,
      height: 600,
      title: `Air Pollution - Showing the ${
        chart === 1 ? "Average" : "Latest"
      } Data from ${dataPoints} ${
        dataPoints === 1 ? "Station" : "Stations"
      } ${
        chart === 1
          ? `using ${locations.reduce(
              (partialSum: any, a: any) => partialSum + a.measurements,
              0
            )} Measurements`
          : ""
      }`,
      xaxis: {
        showgrid: false,
        showline: false,
        showticklabels: false,
      },
      margin: {
        l: 40,
        r: 10,
        b: 10,
        t: 80,
      },
      legend: {
        x: 0,
        y: 1,

        font: {
          size: 15,
        },
        yanchor: "middle",
        xanchor: "left",
      },
      hovermode: "closest",
    };
  }

   /**
   * Calculates The Plotly LAYOUT Settings for The Bar Pollution Chart
   * <p>
   * 
   * It maps out the according API Data from the variable "average" which contains the Layout 
   * Data for the Bar Pollution Chart and inserts them in the Plotly Settings, so they can
   * be fed into the Plotly Component.
   *
   * @author Lukas Kreibig
   */

  const calculateBarLayout = () => {
    return {
      useResizeHandler: true,
      width: 1400,
      height: 600,
      title: `Air Pollution Data - Average of ${average
        .reduce(
          (partialSum: any, a: any) => partialSum + a.measurement_count,
          0
        )
        .toString()
        .replace(
          /(\d)(?=(\d{3})+(?!\d))/g,
          "$1."
        )} Measurements from all Stations in Chosen Time Span and Country`,
      margin: {
        l: 240,
        r: 240,
        b: 100,
        t: 115,
      },
    }
  }

  let config = { responsive: true };

  let data:any = chart === 2 ? calculateBarChart() : calculateBigChart(chart);
  let layout:any = chart === 2 ? calculateBarLayout() : calculateBigLayout(chart);

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

  const [style, api] = useSpring({ x: 0, y: 50 }, [data]);
  useEffect(() => {
    api.start({
      x: 0,
      y: 0,
      delay: 150,
      config: { mass: 1, tension: 280, friction: 60 },
    });
  }, [data, api]);

  return (
    <animated.div style={style}>
      <Plot data={data} layout={layout} config={config} />
    </animated.div>
  );
};

export default Chart;
