import { useEffect, useState } from "react";
import { Layout, PlotData, Shape } from "plotly.js";
import { LatestResult, Parameter } from "../../../react-app-env";

const ChartFunction = () => {
  // Window dimensions code remains unchanged
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

  // Calculate Big Chart
  const calculateBigChart = (chart: string, locations: LatestResult[]) => {
    const parameters: (Parameter & { guideline: number })[] = [
      {
        name: "PM10 µg/m³",
        value: "pm10",
        min: 0,
        max: 1000,
        guideline: 45,
      },
      {
        name: "PM2.5 µg/m³",
        value: "pm25",
        min: 0,
        max: 500,
        guideline: 15,
      },
    ];

    const colors = ["#e9c46a", "#2a9d8f"];

    const traces: Partial<PlotData>[] = [];
    const xValues = locations.map((_, idx) => idx);

    parameters.forEach((para, index) => {
      const yValues = locations.map((data) => {
        const measurement = data.measurements.find(
          (m) => m.parameter === para.value
        );
        if (
          measurement &&
          measurement.value >= para.min &&
          measurement.value <= para.max
        ) {
          return measurement.value;
        } else {
          return null;
        }
      });

      const markerColors = yValues.map((value) => {
        if (value === null) return "#cccccc"; // Gray for missing data
        return value > para.guideline ? "#d62828" : colors[index];
      });

      const hoverTexts = locations.map((data) => {
        const measurement = data.measurements.find(
          (m) => m.parameter === para.value
        );
        const locationName =
          data.location + (data.city ? `, ${data.city}` : "");
        if (!measurement) {
          return `${locationName}<br>${para.name}: No data`;
        }
        const exceeds =
          measurement.value > para.guideline
            ? ` (Exceeds WHO guideline of ${para.guideline} µg/m³)`
            : "";
        return `${locationName}<br>${para.name}: ${measurement.value.toFixed(2)} µg/m³${exceeds}`;
      });

      // Data trace
      traces.push({
        type: "scatter",
        x: xValues,
        y: yValues,
        mode: "markers",
        name: para.name,
        marker: {
          color: markerColors,
          line: {
            color: colors[index],
            width: 1,
          },
          symbol: "circle",
          size: 10,
        },
        text: hoverTexts,
        hoverinfo: "text",
      });

      // WHO guideline line
      traces.push({
        type: "scatter",
        x: [0, xValues.length - 1],
        y: [para.guideline, para.guideline],
        mode: "lines",
        name: `WHO Guideline (${para.name})`,
        line: {
          color: colors[index],
          dash: "dash",
          width: 2,
        },
        hoverinfo: "none",
      });
    });

    return traces;
  };

  // Calculate Big Layout
  const calculateBigLayout = (
    chart: string,
    locations: LatestResult[]
  ): Partial<Layout> => {
    return {
      width: width - 40,
      height: height,
      title: `Air Pollution - Showing the Latest Data <br> from ${
        locations.length
      } ${locations.length === 1 ? "Station" : "Stations"}`,
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

  // Calculate Average Chart
  const calculateAverageChart = (locations: LatestResult[]) => {
    const parameters: (Parameter & { guideline: number })[] = [
      {
        name: "PM10",
        value: "pm10",
        min: 0,
        max: 1000,
        guideline: 45,
      },
      {
        name: "PM2.5",
        value: "pm25",
        min: 0,
        max: 500,
        guideline: 15,
      },
    ];

    // Calculate the average for each parameter
    const averages = parameters.map((para) => {
      const values = locations
        .map((data) => {
          const measurement = data.measurements.find(
            (m) => m.parameter === para.value
          );
          return measurement ? measurement.value : null;
        })
        .filter(
          (value): value is number =>
            value !== null && value >= para.min && value <= para.max
        );

      const average = values.length
        ? values.reduce((a, b) => a + b, 0) / values.length
        : 0;

      return {
        parameter: para.name,
        average,
        guideline: para.guideline,
      };
    });

    // Prepare data for the bar chart
    const traceAverage: Partial<PlotData> = {
      x: averages.map((a) => a.parameter),
      y: averages.map((a) => a.average),
      type: "bar",
      name: "Average",
      marker: {
        color: averages.map((a) =>
          a.average > a.guideline ? "#d62828" : "#2a9d8f"
        ),
      },
      text: averages.map((a) => a.average.toFixed(2) + " µg/m³"),
      textposition: "auto",
      hoverinfo: "x+y",
    };

    return { data: [traceAverage], averages };
  };

  const calculateAverageLayout = (
    averages: { parameter: string; guideline: number }[]
  ) => {
    // Create shapes for WHO guideline lines
    const shapes = averages.map((a, index) => ({
      type: "line",
      x0: index - 0.4, // Start slightly before the bar
      x1: index + 0.4, // End slightly after the bar
      y0: a.guideline,
      y1: a.guideline,
      xref: "x",
      yref: "y",
      line: {
        color: "#000000",
        dash: "dash",
        width: 2,
      },
    }));

    // Add annotations for guideline values
    const annotations = averages.map((a, index) => ({
      x: a.parameter,
      y: a.guideline,
      xref: "x",
      yref: "y",
      text: `WHO Guideline: ${a.guideline} µg/m³`,
      showarrow: false,
      yshift: -10,
      font: {
        color: "#000000",
        size: 12,
      },
    }));

    return {
      width: width - 40,
      height: height - 150,
      title: "Average Air Pollution with WHO Guidelines",
      xaxis: {
        title: "Parameter",
      },
      yaxis: {
        title: "Concentration (µg/m³)",
      },
      margin: {
        l: 60,
        r: 10,
        b: 80,
        t: 80,
      },
      shapes: shapes,
      annotations: annotations,
      legend: {
        x: 0,
        y: 1,
        font: {
          size: 12,
        },
        yanchor: "top",
        xanchor: "left",
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
