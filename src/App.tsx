/**
 * @file App.tsx
 * @desc Main application component that fetches data from OpenAQ and renders a scatter or map view.
 *       It also controls a Joyride tutorial for first-time users and displays a legal/privacy link
 *       once the map has fully loaded.
 */

import React, { useEffect, useState, useCallback } from 'react';
import './App.css';
import ChartList from './components/ChartList/ChartList';
import Dropdown from './components/Dropdown/Dropdown';
import { SelectChangeEvent, Box } from '@mui/material';
import { Country, Data } from './react-app-env';
import Joyride, { CallBackProps, Step } from 'react-joyride';
import LoadingOverlay from './assets/LoadingOverlay';
import { Analytics } from '@vercel/analytics/react';
import LegalModal from './components/LegalModal';
import tourSteps from './components/tourSteps';
import PersistentOverlay from './components/PersistentOverlay';

/**
 * Fetches data from OpenAQ, displays it as either a scatter chart (chart=1) or map (chart=2),
 * and coordinates application state such as loading indicators, Joyride steps, and legal disclaimers.
 * @returns The main React component for the application.
 */
const App: React.FC = () => {
  /**
   * @property data - The fetched data from OpenAQ.
   * @property countriesList - A list of countries from the API.
   * @property dataLoaded - Controls the spinner for data load state.
   * @property mapLoaded - Controls the spinner for map load state.
   * @property error - Any error message from fetching data.
   * @property time - The selected temporal range.
   * @property chart - The selected chart type (1=scatter, 2=map).
   * @property country - The selected country ID.
   * @property showSidebar - Whether the sidebar is visible.
   * @property runTour - Whether the Joyride tutorial should run.
   * @property steps - Steps for the Joyride tutorial.
   * @property isLegalOpen - Whether the legal modal is open.
   * @property linkVisible - Whether to show the legal link (after map load).
   * @property baseUrl - The base URL for the data API.
   */
  const [data, setData] = useState<Data | null>(null);
  const [countriesList, setCountriesList] = useState<Country[]>([]);
  const [dataLoaded, setDataLoaded] = useState<boolean>(false);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [time, setTime] = useState<string>('month');
  const [chart, setChart] = useState<string>('2');
  const [country, setCountry] = useState<string>('50');
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [runTour, setRunTour] = useState<boolean>(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [isLegalOpen, setIsLegalOpen] = useState<boolean>(false);

  const linkVisible = mapLoaded;
  const baseUrl = 'https://airpollution-mocha.vercel.app/api/fetchData';

  /**
   * Asynchronously fetches air quality data and a list of countries from the API.
   * Resets the loading flags before fetching and handles error or success states.
   */
  const getData = useCallback(async () => {
    try {
      setDataLoaded(false);
      setMapLoaded(false);
      const [latestFetch, countriesFetch] = await Promise.all([
        fetch(
          `${baseUrl}?path=/v2/latest&spatial=country&country_id=${country}&temporal=${time}&parameter=pm10&parameter=pm25&limit=2000`
        ),
        fetch(`${baseUrl}?path=/v3/countries?limit=200`),
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
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
      setData(null);
    } finally {
      setDataLoaded(true);
    }
  }, [baseUrl, country, time]);

  /**
   * Initializes data fetching and sets Joyride steps on mount.
   */
  useEffect(() => {
    getData();
    setSteps(tourSteps);
  }, [getData]);

  /**
   * If there's no map (chart !== '2'), mark the map loaded once data is fetched.
   */
  useEffect(() => {
    if (dataLoaded && chart !== '2') {
      setMapLoaded(true);
    }
  }, [chart, dataLoaded]);

  /**
   * Starts the Joyride tour if chart=2, data is loaded, and no localStorage visit flag is set.
   */
  useEffect(() => {
    if (dataLoaded && chart === '2') {
      const hasVisited = localStorage.getItem('hasVisited');
      if (!hasVisited) {
        setShowSidebar(true);
        const timer = setTimeout(() => setRunTour(true), 600);
        return () => clearTimeout(timer);
      }
    }
  }, [chart, dataLoaded]);

  /**
   * Handles Joyride's callback. Skips or finishes the tutorial and sets localStorage accordingly.
   * @param info - Contains status information about Joyride events.
   */
  const handleJoyrideCallback = (info: CallBackProps) => {
    if (info.status === 'skipped' || info.status === 'finished') {
      setTimeout(() => {
        setRunTour(false);
        localStorage.setItem('hasVisited', 'true');
      }, 100);
    }
  };

  /**
   * Handles dropdown selections for country, chart type, and time.
   * @param event - The select change event.
   */
  const handleSelect = (event: SelectChangeEvent) => {
    if (event.target.name === 'Country') {
      setCountry(event.target.value as string);
    } else if (event.target.name === 'View') {
      setChart(event.target.value as string);
    } else if (event.target.name === 'Time') {
      setTime(event.target.value as string);
    }
  };

  const loadingOverlayActive = !dataLoaded || !mapLoaded;

  /**
   * Renders the main application layout including the Joyride tutorial,
   * loading overlay, chart/map display, and legal/privacy modal.
   */
  return (
    <div className="App" style={{ height: '90vh', position: 'relative' }}>
      {runTour && <PersistentOverlay />}
      <Joyride
        steps={steps}
        run={runTour}
        continuous
        showSkipButton
        showProgress
        callback={handleJoyrideCallback}
        disableOverlay
        styles={{
          options: {
            zIndex: 10000,
          },
        }}
      />
      <LoadingOverlay
        loading={loadingOverlayActive}
        message="Loading data & map..."
      />
      <Box
        style={{
          position: 'relative',
          opacity: loadingOverlayActive ? 0.5 : 1,
          transition: 'opacity 0.3s ease-in-out',
          height: '100%',
        }}
      >
        <Box
          style={{
            position: 'absolute',
            top: '10px',
            left: showSidebar && chart === '2' ? '320px' : '70px',
            zIndex: 1,
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}>
            <Dropdown
              handleSelect={handleSelect}
              dataValue={chart}
              dropdown="View"
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
            onMapLoadEnd={() => setMapLoaded(true)}
          />
        )}
      </Box>
      {linkVisible && (
        <Box
          sx={{
            position: 'absolute',
            bottom: '-2px',
            right: '22px',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: '4px',
            fontSize: '12px',
            color: 'rgb(0 0 0 / 75%)',
            backgroundColor: 'rgba(255,255,255,0.5)',
            padding: '4px 6px',
            borderRadius: '4px',
          }}
        >
          <Box
            onClick={() => setIsLegalOpen(true)}
            sx={{
              textDecoration: 'underline',
              cursor: 'pointer',
              marginRight: '10px',
            }}
          >
            Legal & Privacy
          </Box>
          <Box>
            Data courtesy of{' '}
            <a
              href="https://openaq.org/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'underline', color: '#555' }}
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
