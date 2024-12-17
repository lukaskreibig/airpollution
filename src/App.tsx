import React, { useEffect, useState, useCallback } from "react";
import "./App.css";
import ChartList from "./components/ChartList/ChartList";
import Dropdown from "./components/Dropdown/Dropdown";
import { SelectChangeEvent, Box } from "@mui/material";
import { Country, Data } from "./react-app-env";
import Joyride, { CallBackProps, STATUS, Step } from "react-joyride";
import LoadingOverlay from "./assets/LoadingOverlay";
import { Analytics } from "@vercel/analytics/react";
import LegalModal from "./components/LegalModal";

/**
 * This App fetches data from OpenAQ, displaying scatter (chart=1), average (2), or map (3).
 * The LoadingOverlay re-appears whenever "country/time" changes. 
 * For chart=3, we wait for the map to fully load (onMapLoadEnd -> setMapLoaded(true)).
 * For chart=1 or 2, there's no map, so we automatically set mapLoaded=true once data is fetched.
 */

const App: React.FC = () => {
  const [data, setData] = useState<Data | null>(null);
  const [countriesList, setCountriesList] = useState<Country[]>([]);

  // Flags to control spinner logic
  const [dataLoaded, setDataLoaded] = useState<boolean>(false);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);

  const [error, setError] = useState<string | null>(null);

  // States for time, chart, country
  const [time, setTime] = useState<string>("month");
  const [chart, setChart] = useState<string>("3"); // default map
  const [country, setCountry] = useState<string>("50"); // '50' might be Germany

  const [showSidebar, setShowSidebar] = useState<boolean>(false);

  // Joyride states
  const [runTour, setRunTour] = useState<boolean>(false);
  const [tourSteps, setTourSteps] = useState<Step[]>([]);

  // Legal modal
  const [isLegalOpen, setIsLegalOpen] = useState<boolean>(false);

  // Show "Legal & Privacy" link only after map is fully loaded
  const linkVisible = mapLoaded;

  const baseUrl = "https://airpollution-mocha.vercel.app/api/fetchData";

  // Define Joyride steps
  const defineTourSteps = (): Step[] => [
    {
      target: ".map-area",
      content: "Welcome to the Air Quality Dashboard!\n\nWe'll do a short tour.",
      placement: "center",
      title: "Welcome!",
      disableBeacon: true,
      spotlightClicks: true,
    },
    {
      target: ".chart-dropdown",
      content: "Select Chart type: 1=Scatter, 2=Avg bar, 3=Map",
      placement: "bottom",
      title: "Chart Selection",
      disableBeacon: true,
      spotlightClicks: true,
    },
    {
      target: ".country-dropdown",
      content: "Choose a country to fetch its air quality data.",
      placement: "bottom",
      title: "Country Selection",
      spotlightClicks: true,
    },
    // ... add more steps as needed
  ];

  // Async fetch data
  const getData = useCallback(async () => {
    try {
      // Whenever the user picks a new country/time, reset both flags => show spinner
      setDataLoaded(false);
      setMapLoaded(false);

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

  useEffect(() => {
    getData();
    setTourSteps(defineTourSteps());
  }, [getData]);

  // If chart !=3, there's no map => set mapLoaded=true automatically once data loaded
  useEffect(() => {
    if (dataLoaded && chart !== "3") {
      setMapLoaded(true);
    }
  }, [chart, dataLoaded]);

  // Possibly run the Joyride if chart=3
  useEffect(() => {
    if (dataLoaded && chart === "3") {
      const hasVisited = localStorage.getItem("hasVisited");
      if (!hasVisited) {
        setShowSidebar(true);
        const timer = setTimeout(() => setRunTour(true), 600);
        return () => clearTimeout(timer);
      }
    }
  }, [chart, dataLoaded]);

  // Joyride callback fix
  const handleJoyrideCallback = (info: CallBackProps) => {
    const { status } = info;
    // Fix TS error: We compare directly with constants
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRunTour(false);
      localStorage.setItem("hasVisited", "true");
    }
  };

  // handleSelect
  const handleSelect = (event: SelectChangeEvent) => {
    if (event.target.name === "Country") {
      setCountry(event.target.value as string);
    } else if (event.target.name === "Chart") {
      setChart(event.target.value as string);
    } else if (event.target.name === "Time") {
      setTime(event.target.value as string);
    }
  };

  const loadingOverlayActive = (!dataLoaded || !mapLoaded);

  return (
    <div className="App" style={{ height: "90vh", position: "relative" }}>
      <Joyride
        steps={tourSteps}
        run={runTour}
        continuous
        showSkipButton
        showProgress
        callback={handleJoyrideCallback}
        styles={{ options: { zIndex: 10000 } }}
      />

      <LoadingOverlay loading={loadingOverlayActive} message="Loading data & map..." />

      <Box
        style={{
          position: "relative",
          opacity: loadingOverlayActive ? 0.5 : 1,
          transition: "opacity 0.3s ease-in-out",
          height: "100%",
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
            <Dropdown
              handleSelect={handleSelect}
              dataValue={time}
              dropdown="Time"
              className="time-dropdown"
            />
          </Box>
        </Box>

        {error && (
          <Box className="charts" id="message">
            {`Error fetching data: ${error}`}
          </Box>
        )}

        {!data && !dataLoaded && (
          <Box className="charts" id="message">
            Loading data for the first time. This might take a while!
          </Box>
        )}

        {data && (
          <ChartList
            locations={data.results}
            chart={chart}
            country={country}
            countriesList={countriesList}
            showSidebar={showSidebar}
            setShowSidebar={setShowSidebar}
            // callback from the map => set mapLoaded true
            onMapLoadEnd={() => setMapLoaded(true)}
          />
        )}
      </Box>

      {linkVisible && (
        <Box
          sx={{
            position: "absolute",
            bottom: "-2px",
            right: "22px",
            zIndex: 9999,
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-end",
            gap: "4px",
            fontSize: "12px",
            color: "rgb(0 0 0 / 75%)",
            backgroundColor: "rgba(255,255,255,0.5)",
            padding: "4px 6px",
            borderRadius: "4px",
          }}
        >
          <Box sx={{ textDecoration: "underline", cursor: "pointer", marginRight: "10px" }}>
            Legal & Privacy
          </Box>
          <Box>
            Data courtesy of{" "}
            <a
              href="https://openaq.org/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "underline", color: "#555" }}
            >
              OpenAQ
            </a>
          </Box>
        </Box>
      )}

      <Analytics />
      <LegalModal open={isLegalOpen} onClose={() => setIsLegalOpen(false)} />
    </div>
  );
};

export default App;
