import { useEffect, useState } from "react";
import { PlotData, Layout } from "plotly.js";
import { LatestResult, Parameter } from "../../../react-app-env";

const ChartFunction = () => {
  const getWindowDimensions = () => {
    const { innerWidth: width, innerHeight: height } = window;
    return {
      width,
      height,
    };
  };

  const useWindowDimensions = () => {
    const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());

    useEffect(() => {
      const handleResize = () => {
        setWindowDimensions(getWindowDimensions());
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);

    return windowDimensions;
  };

  const { height, width } = useWindowDimensions();

  const calculateBigChart = (chart: string, locations: LatestResult[]): Partial<PlotData>[] => {
    const parameters: Parameter[] = [
      { name: "PM10 µg/m³", value: "pm10" },
      { name: "PM2.5 µg/m³", value: "pm25" },
    ];

    const colors = ["#e9c46a", "#2a9d8f"];

    return parameters.map((para: Parameter, index: number) => {
      return {
        type: "scatter",
        x: locations.map((data) => {
          const measurement = data.measurements.find(
            (m) => m.parameter === para.value
          );
          return (
            data.location +
            (data.city ? `, ${data.city}` : "") +
            (measurement && measurement.lastUpdated
              ? `, Latest Update: ${measurement.lastUpdated.split("T")[0]}`
              : "")
          );
        }),
        y: locations.map((data) => {
          const measurement = data.measurements.find(
            (m) => m.parameter === para.value
          );
          return measurement ? measurement.value : null;
        }),
        mode: "markers",
        name: para.name,
        marker: {
          color: colors[index],
          line: {
            color: colors[index],
            width: 1,
          },
          symbol: "circle",
          size: 10,
        },
      };
    });
  };

  const calculateBigLayout = (chart: string, locations: LatestResult[]): Partial<Layout> => {
    return {
      width: width - 40,
      height: height - 150,
      title: `Air Pollution - Showing the ${
        chart === "1" ? "Average" : "Latest"
      } Data <br> from ${locations.length} ${
        locations.length === 1 ? "Station" : "Stations"
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
  };

  return {
    calculateBigChart,
    calculateBigLayout,
    useWindowDimensions,
  };
};

export default ChartFunction;
