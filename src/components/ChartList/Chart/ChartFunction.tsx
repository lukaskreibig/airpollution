import { useEffect, useState } from "react";

const ChartFunction = () => {
  /**
   * Gets and Returns the Interior Width and Interior Height of the User.
   * This data is crucial for the self-build responsive function which follows up.
   *
   * @author Lukas Kreibig
   */

  const getWindowDimensions = () => {
    const { innerWidth: width, innerHeight: height } = window;
    return {
      width,
      height,
    };
  };

  /**
   * Updates the Interior Width and Height
   * <p>
   * This data is crucial for the self-build responsive function which follows up.
   *
   * @author Lukas Kreibig
   */

  const useWindowDimensions = () => {
    const [windowDimensions, setWindowDimensions] = useState(
      getWindowDimensions()
    );

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
   * @return Returns an Array of Objects with Setting Options for the X and Y Axis of Plotly Data
   */

  const calculateBigChart = (chart: string, locations: results) => {
    let parameter: parameter[] = [
      { name: "PM 10 µg/m³", value: "pm10" },
      { name: "PM 2.5 µg/m³", value: "pm25" },
    ];

    let color = ["#e9c46a", "#2a9d8f"];

    return parameter.map((para: parameter, index: number) => {
      return {
        type: "scatter",
        x: locations.map(
          (data: any) =>
            data.name +
            (data.city
              ? `, ${data.city}, Latest Update: ${
                  data.lastUpdated.split("T")[0]
                }`
              : "")
        ),
        y: locations
          .map((data: any) =>
            data.parameters
              .filter((pm: any) => pm.parameter === para.value)
              .map((value: any) =>
                chart === "3" ? value.lastValue : value.average
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
  };

  /**
   * Calculates The Plotly DATA Settings for The Average Pollution Chart
   * <p>
   *
   * It maps out the according API Data from the variable "average" which contains the Data
   * for the Bar Pollution Chart and inserts them in the Plotly Settings, so they can
   * be fed into the Plotly Component.
   *
   * @author Lukas Kreibig
   * @return Returns an Array of Objects with Setting Options for the X and Y Axis of Plotly Data
   */

  const calculateBarChart = (average: results) => {
    return [
      {
        type: "bar",
        x: average.map((data: any) => data.displayName + " " + data.unit),
        y: average.map((data: any) => data.average),
        marker: { color: "#f4a261" },
      },
    ];
  };

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
   * @param locations Array of API Data for all Stations and Measurements
   * @return Returns a Layout Options Object for the X and Y Axis of Plotly Layout Data
   */

  const calculateBigLayout = (chart: string, locations: results) => {
    return {
      width: width - 40,
      height: height - 150,
      title: `Air Pollution - Showing the ${
        chart === "1" ? "Average" : "Latest"
      } Data <br> from ${locations.length} ${
        locations.length === 1 ? "Station" : "Stations"
      } ${
        chart === "1"
          ? `using ${locations
              .reduce(
                (partialSum: any, a: any) => partialSum + a.measurements,
                0
              )
              .toString()
              .replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.")} Measurements`
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
  };

  /**
   * Calculates The Plotly LAYOUT Settings for The Bar Pollution Chart
   * <p>
   *
   * It maps out the according API Data from the variable "average" which contains the Layout
   * Data for the Bar Pollution Chart and inserts them in the Plotly Settings, so they can
   * be fed into the Plotly Component.
   *
   * @author Lukas Kreibig
   * @param average contains the average API Data which is being used in the title
   * @return Returns a Layout Options Object for the X and Y Axis of Plotly Layout Data
   */

  const calculateBarLayout = (average: results) => {
    return {
      width: width - 40,
      height: height - 150,
      title: `Air Pollution Data - Average of ${average
        .reduce(
          (partialSum: any, a: any) => partialSum + a.measurement_count,
          0
        )
        .toString()
        .replace(
          /(\d)(?=(\d{3})+(?!\d))/g,
          "$1."
        )} Measurements <br> from all Stations in Chosen Time Span and Country`,
      margin: {
        l: 240,
        r: 240,
        b: 100,
        t: 115,
      },
    };
  };

  return {
    calculateBarChart,
    calculateBarLayout,
    calculateBigChart,
    calculateBigLayout,
    useWindowDimensions,
  };
};

export default ChartFunction;
