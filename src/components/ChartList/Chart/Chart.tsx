import { useEffect } from "react";
import Plot from "react-plotly.js";
import { animated, useSpring } from "react-spring";
import "../../../App.css";

type Props = {
  refineData: any;
  dataPoints: number;
  chart: number;
  dataAPI: any;
};
const Chart: React.FC<Props> = ({ refineData, dataPoints, chart, dataAPI }) => {
  let parameter = [
    { name: "PM 10 µg/m³", value: "pm10" },
    { name: "PM 2.5 µg/m³", value: "pm25" },
  ];
  let color = ["#e9c46a", "#2a9d8f"];

  let dataSettings = parameter.map((para: any, index: number) => {
    return {
      type: "scatter",
      x: dataAPI.map(
        (data: any) =>
          data.name +
          (data.city
            ? `, ${data.city}, Latest Update: ${data.lastUpdated.split("T")[0]}`
            : "")
      ),
      y: dataAPI
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

  let barSettings = [
    {
      type: "bar",
      x: refineData.map((data: any) => data.displayName + " " + data.unit),
      y: refineData.map((data: any) => data.average),
      marker: { color: "#f4a261" },
    },
  ];

  let data: any = chart === 2 ? barSettings : dataSettings;

  let config = { responsive: true };

  let layout: any =
    chart === 2
      ? {
          useResizeHandler: true,
          width: 1400,
          height: 600,
          title: `Air Pollution Data - Average of ${refineData
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
      : {
          width: 1400,
          height: 600,
          title: `Air Pollution - Showing the ${
            chart === 1 ? "Average" : "Latest"
          } Data from ${dataPoints} ${
            dataPoints === 1 ? "Station" : "Stations"
          } ${
            chart === 1
              ? `using ${dataAPI.reduce(
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
