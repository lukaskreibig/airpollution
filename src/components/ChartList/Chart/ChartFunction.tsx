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

  const calculateBigChart = (chart: string, locations: LatestResult[]) => {
    const parameters: (Parameter & { min: number; max: number; guideline: number })[] = [
      { name: "PM10 µg/m³", value: "pm10", min: 0, max: 1000, guideline: 45 },
      { name: "PM2.5 µg/m³", value: "pm25", min: 0, max: 500, guideline: 15 },
    ];

    const colors = ["#e9c46a", "#2a9d8f"];

    return parameters.map((para, index) => {
      // Filter valid data
      const validLocations = locations.filter((data) => {
        const measurement = data.measurements.find((m) => m.parameter === para.value);
        return (
          measurement &&
          measurement.value >= para.min &&
          measurement.value <= para.max
        );
      });

      return {
        type: "scatter",
        x: validLocations.map((data) => {
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
        y: validLocations.map((data) => {
          const measurement = data.measurements.find(
            (m) => m.parameter === para.value
          );
          return measurement ? measurement.value : null;
        }),
        mode: "markers",
        name: para.name,
        marker: {
          color: validLocations.map((data) => {
            const measurement = data.measurements.find(
              (m) => m.parameter === para.value
            );
            return measurement && measurement.value > para.guideline
              ? "#d62828" // Red color for exceedances
              : colors[index];
          }),
          line: {
            color: colors[index],
            width: 1,
          },
          symbol: "circle",
          size: 10,
        },
        text: validLocations.map((data) => {
          const measurement = data.measurements.find(
            (m) => m.parameter === para.value
          );
          return measurement && measurement.value > para.guideline
            ? `Exceeds WHO guideline of ${para.guideline} µg/m³`
            : "";
        }),
        hoverinfo: "text+x+y",
      };
    });
  };

  const calculateBigLayout = (chart: string, locations: LatestResult[]): Partial<Layout> => {
    return {
      width: width - 40,
      height: height - 150,
      title: `Air Pollution - Showing the Latest Data <br> from ${locations.length} ${
        locations.length === 1 ? "Station" : "Stations"
      }`,
      xaxis: {
        showgrid: false,
        showline: false,
        showticklabels: false,
      },
      yaxis: {
        title: "Concentration (µg/m³)",
      },
      margin: {
        l: 60,
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
        yanchor: "top",
        xanchor: "left",
      },
      hovermode: "closest",
    };
  };

  const calculateAverageChart = (locations: LatestResult[]) => {
    const parameters: (Parameter & { min: number; max: number; guideline: number })[] = [
      { name: "PM10 µg/m³", value: "pm10", min: 0, max: 1000, guideline: 45 },
      { name: "PM2.5 µg/m³", value: "pm25", min: 0, max: 500, guideline: 15 },
    ];

    return parameters.map((para) => {
      const values = locations
        .map((data) => {
          const measurement = data.measurements.find((m) => m.parameter === para.value);
          return measurement ? measurement.value : null;
        })
        .filter(
          (value): value is number =>
            value !== null && value >= para.min && value <= para.max
        );

      const average = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;

      return {
        type: "bar",
        x: [para.name],
        y: [average],
        marker: {
          color: average > para.guideline ? "#d62828" : "#f4a261",
        },
        text: average > para.guideline
          ? `Exceeds WHO guideline of ${para.guideline} µg/m³`
          : "",
        hoverinfo: "text+x+y",
      };
    });
  };

  const calculateAverageLayout = (): Partial<Layout> => {
    return {
      width: width - 40,
      height: height - 150,
      title: `Average Air Pollution Data`,
      yaxis: {
        title: "Average Concentration (µg/m³)",
      },
      margin: {
        l: 60,
        r: 10,
        b: 50,
        t: 80,
      },
    };
  };

  return {
    calculateBigChart,
    calculateBigLayout,
    calculateAverageChart,
    calculateAverageLayout,
    useWindowDimensions,
  };
};

export default ChartFunction;
