import React, { useEffect, useState, useCallback } from "react";
import "./App.css";
import ChartList from "./components/ChartList/ChartList";
import Dropdown from "./components/Dropdown/Dropdown";
import { SelectChangeEvent, Box } from "@mui/material";
import { Country, Data } from "./react-app-env";
import Joyride, { CallBackProps, STATUS, Step } from "react-joyride";
import LoadingOverlay from "./assets/LoadingOverlay";
import { Analytics } from '@vercel/analytics/next';

const App: React.FC = () => {
  const [data, setData] = useState<Data | null>(null);
  const [countriesList, setCountriesList] = useState<Country[]>([]);

  // Two loading flags
  const [dataLoaded, setDataLoaded] = useState<boolean>(false);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);

  const [error, setError] = useState<string | null>(null);

  const [time, setTime] = useState<string>("month");
  const [chart, setChart] = useState<string>("3"); // Default to "3" to show the map first
  const [country, setCountry] = useState<string>("50");

  const [showSidebar, setShowSidebar] = useState<boolean>(false);

  // Guided Tour states
  const [runTour, setRunTour] = useState<boolean>(false);
  const [tourSteps, setTourSteps] = useState<Step[]>([]);

  const baseUrl = "https://airpollution-mocha.vercel.app/api/fetchData";

    // Define the steps for the guided tour
    const defineTourSteps = (): Step[] => [
      // Introduction Step
      {
        target: ".map-area",
        content: "Welcome to the Air Quality Dashboard!\n\nMonitor real-time air pollution data from cities worldwide, powered by OpenAQ's live API. Explore interactive maps and charts to gain insights into air quality trends. Let's take a quick tour to discover all the features!",
        placement: "center",
        title: "Welcome!",
        disableBeacon: true,
        spotlightClicks: true,
      },
            // Average in Germany
            {
              target: ".average-plot",
              content: "Average Plot",
              placement: "bottom",
              title: "Welcome!",
              disableBeacon: true,
              spotlightClicks: true,
            },
      // Chart Selection
      {
        target: ".chart-dropdown",
        content: "Choose the chart type that best suits the insights you want to explore. Different charts offer various perspectives on air quality data.",
        placement: "bottom",
        title: "Chart Selection",
        disableBeacon: true,
        spotlightClicks: true,
      },
      // Country Selection
      {
        target: ".country-dropdown",
        content: "Select a country to focus the air quality data analysis. This filter helps you view pollution levels specific to your region of interest.",
        placement: "bottom",
        title: "Country Selection",
        spotlightClicks: true,
      },
      // Sidebar Toggle
      {
        target: ".sidebar-toggle-button",
        content:
          "Click here to open the sidebar. Use it to search for specific cities and sort the list based on your preferences.",
        placement: "right",
        title: "Sidebar Toggle",
        spotlightClicks: true,
      },
      // Search Function
      {
        target: ".search-field",
        content:
          "Use this search bar to quickly locate specific cities or locations within the selected country.",
        placement: "bottom",
        title: "Search Function",
        spotlightClicks: true,
      },
      // Sort Function (By Name, PM2.5, PM10)
      {
        target: ".choose-sort",
        content:
          "Sort the city list by Name, PM2.5, or PM10 levels to organize the data according to your analysis needs.",
        placement: "bottom",
        title: "Sort Function",
        spotlightClicks: true,
      },
      // Sort Direction Toggle
      {
        target: ".sort-select",
        content:
          "Click here to switch between ascending and descending order, refining how your sorted data is displayed.",
        placement: "bottom",
        title: "Sort Direction",
        spotlightClicks: true,
      },
      // Close Sidebar
      {
        target: ".close-list",
        content:
          "Click here to close the sidebar and view the full map.",
        placement: "bottom",
        title: "Close Sidebar",
        spotlightClicks: true,
      },
      // Interactive Map Points
      {
        target: ".map-area",
        content:
          "Hover over the map points to see detailed air quality information for each location.",
        placement: "center",
        title: "Interactive Map Points",
        spotlightClicks: true,
      },
    ];
  

  // Async data fetch
  const getData = useCallback(async () => {
    try {
      setDataLoaded(false);  // Mark data loading
      const [latestFetch, countriesFetch] = await Promise.all([
        fetch(
          `${baseUrl}?path=/v2/latest&spatial=country&country_id=${country}&temporal=${time}&parameter=pm10&parameter=pm25&limit=2000`
        ),
        fetch(`${baseUrl}?path=/v3/countries`),
      ]);

      if (!latestFetch.ok || !countriesFetch.ok) {
        throw new Error(
          `Error fetching data: ${
            !latestFetch.ok
              ? `Latest Data ${latestFetch.status}`
              : `Country Data: ${countriesFetch.status}`
          }`
        );
      }

      const airQualityData: Data = await latestFetch.json();
      const countriesData: { results: Country[] } = await countriesFetch.json();

      setData(airQualityData);
      setCountriesList(countriesData.results);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setData(null);
    } finally {
      setDataLoaded(true);
    }
  }, [baseUrl, country, time]);

  // On mount / dependencies change: fetch data + define steps
  useEffect(() => {
    getData();
    setTourSteps(defineTourSteps());
  }, [getData]);

  // After data is loaded, check if we should run the tour
  useEffect(() => {
    const hasVisited = localStorage.getItem("hasVisited");
    if (!hasVisited && chart === "3" && dataLoaded) {
      setShowSidebar(true);
      const timer = setTimeout(() => setRunTour(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [chart, dataLoaded]);

  // Joyride callback
  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    if (finishedStatuses.includes(status)) {
      setRunTour(false);
      localStorage.setItem("hasVisited", "true");
    }
  };

  // Handle dropdown changes
  const handleSelect = (event: SelectChangeEvent) => {
    if (event.target.name === "Country") {
      setCountry(event.target.value as string);
    } else if (event.target.name === "Chart") {
      setChart(event.target.value as string);
    } else if (event.target.name === "Time") {
      setTime(event.target.value as string);
    }
  };

  // The overlay remains visible until BOTH data and map are loaded
  const loadingOverlayActive = !dataLoaded || !mapLoaded;

  return (
    <Box className="App" style={{height: "90vh"}}>
      <Joyride
        steps={tourSteps}
        run={runTour}
        continuous
        showSkipButton
        showProgress
        callback={handleJoyrideCallback}
        styles={{
          options: { zIndex: 10000 },
        }}
      />

      {/* Single Loading Overlay */}
      <LoadingOverlay
        loading={loadingOverlayActive}
        message="Loading data & map..."
      />

      <Box
        style={{
          position: "relative",
          opacity: loadingOverlayActive ? 0.5 : 1,
          transition: "opacity 0.3s ease-in-out",
        }}
      >
        {/* Top-left dropdowns */}
        <Box
          style={{
            position: "absolute",
            top: "10px",
            left: showSidebar && chart === "3" ? "320px" : "70px",
            zIndex: 1,
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "row", gap: 1 }}>
            <Dropdown
              handleSelect={handleSelect}
              dataValue={chart}
              dropdown="Chart"
              className="chart-dropdown"
            />
            {countriesList.length > 0 && (
              <Dropdown
                handleSelect={handleSelect}
                dataValue={country}
                dropdown="Country"
                countries={countriesList}
                className="country-dropdown"
              />
            )}
          </Box>
        </Box>

        {/* Error handling */}
        {error && (
          <Box className="charts" id="message">
            {`Error fetching data: ${error}`}
          </Box>
        )}

        {/* First-time loading message */}
        {!data && !dataLoaded && (
          <Box className="charts" id="message">
            Loading data for the first time. This might take a while!
          </Box>
        )}

        {/* ChartList once data is ready */}
        {data && (
          <ChartList
            locations={data.results}
            chart={chart}
            country={country}
            countriesList={countriesList}
            showSidebar={showSidebar}
            setShowSidebar={setShowSidebar}
            onMapLoadEnd={() => setMapLoaded(true)}
          />
        )}
      </Box>
      <Analytics />
    </Box>
  );
};

export default App;
