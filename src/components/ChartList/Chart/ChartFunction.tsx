import { useEffect, useState } from "react";
import { Layout, PlotData, Shape, Annotations } from "plotly.js";
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
  
    const colors = ["#e9c46a", "#2a9d8f"]; // Farben für PM10 und PM2.5
  
    const traces: Partial<PlotData>[] = [];
    const xValues = locations.map((_, idx) => idx);
  
    parameters.forEach((para, index) => {
      const xWithin: number[] = [];
      const yWithin: number[] = [];
      const hoverWithin: string[] = [];
  
      const xExceeds: number[] = [];
      const yExceeds: number[] = [];
      const hoverExceeds: string[] = [];
  
      locations.forEach((data, idx) => {
        const measurement = data.measurements.find(
          (m) => m.parameter === para.value
        );
        if (
          measurement &&
          measurement.value >= para.min &&
          measurement.value <= para.max
        ) {
          const value = measurement.value;
          const locationName =
            data.location + (data.city ? `, ${data.city}` : "");
  
          const hoverText = `${locationName}<br>${para.name}: ${value.toFixed(
            2
          )} µg/m³${
            value > para.guideline
              ? ` (Exceeds WHO guideline of ${para.guideline} µg/m³)`
              : ""
          }`;
  
          if (value > para.guideline) {
            xExceeds.push(idx);
            yExceeds.push(value);
            hoverExceeds.push(hoverText);
          } else {
            xWithin.push(idx);
            yWithin.push(value);
            hoverWithin.push(hoverText);
          }
        }
        // Fehlende oder ungültige Daten ignorieren
      });
  
      // Trace für Werte innerhalb der Richtlinien
      if (xWithin.length > 0) {
        traces.push({
          type: "scatter" as const,
          x: xWithin,
          y: yWithin,
          mode: "markers" as const,
          name: `${para.name} Within Guidelines`,
          marker: {
            color: colors[index],
            symbol: "circle" as const,
            size: 10,
            line: {
              color: "#000000",
              width: 1,
            },
          },
          text: hoverWithin,
          hoverinfo: "text",
          showlegend: true,
        });
      }
  
      // Trace für Werte, die die Richtlinien überschreiten
      if (xExceeds.length > 0) {
        traces.push({
          type: "scatter" as const,
          x: xExceeds,
          y: yExceeds,
          mode: "markers" as const,
          name: `${para.name} Exceeds Guidelines`,
          marker: {
            color: colors[index],
            symbol: "triangle-up" as const,
            size: 10,
            line: {
              color: "#000000",
              width: 1,
            },
          },
          text: hoverExceeds,
          hoverinfo: "text",
          showlegend: true,
        });
      }
  
      // WHO-Richtwert-Linie
      traces.push({
        type: "scatter" as const,
        x: [0, xValues.length - 1],
        y: [para.guideline, para.guideline],
        mode: "lines" as const,
        name: `WHO Guideline (${para.name})`,
        line: {
          color: colors[index],
          dash: "dash",
          width: 2,
        },
        hoverinfo: "none" as const,
        showlegend: true,
      });
    });
  
    return traces;
  };
  

  const calculateBigLayout = (
    chart: string,
    locations: LatestResult[]
  ): Partial<Layout> => {
    return {
      width: width - 40,
      height: height - 47,
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
        b: 40
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
    averages: { parameter: string; guideline: number; average: number }[]
  ): Partial<Layout> => {
    const maxYValue = Math.max(
      ...averages.map((a) => Math.max(a.average, a.guideline))
    );
  
    const yAxisMax = maxYValue * 1.2;
  
    const shapes: Partial<Shape>[] = averages.map((a, index) => ({
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
  
    const annotations: Partial<Annotations>[] = averages.map((a, index) => ({
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
      height: height -47,
      title: "Average Air Pollution with WHO Guidelines",
      xaxis: {
        title: "Parameter",
      },
      yaxis: {
        title: "Concentration (µg/m³)",
        autorange: false,
        range: [0, yAxisMax], // Fixed range to prevent autoscaling
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
