/**
 * @file App.tsx
 * @desc Main application component that fetches data from OpenAQ and renders a scatter or map view.
 *       It also controls a Joyride tutorial for first-time users and displays a legal/privacy link
 *       once the map has fully loaded.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import './App.css';
import ChartList from './components/ChartList/ChartList';
import { Box } from '@mui/material';
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
   * @property dataLoaded - Controls the spinner for data load state.
   * @property mapLoaded - Controls the spinner for map load state.
   * @property error - Any error message from fetching data.
   * @property showSidebar - Whether the sidebar is visible.
   * @property runTour - Whether the Joyride tutorial should run.
   * @property steps - Steps for the Joyride tutorial.
   * @property isLegalOpen - Whether the legal modal is open.
   * @property linkVisible - Whether to show the legal link (after map load).
   */
  const [dataLoaded, setDataLoaded] = useState<boolean>(false);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [runTour, setRunTour] = useState<boolean>(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [isLegalOpen, setIsLegalOpen] = useState<boolean>(false);
  const [waqiData, setWaqiData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const linkVisible = mapLoaded;

  /**
   * Initializes data fetching and sets Joyride steps on mount.
   */
  useEffect(() => {
    setSteps(tourSteps);
  }, []);

  /**
   * If there's no map (chart !== '2'), mark the map loaded once data is fetched.
   */
  useEffect(() => {
    if (dataLoaded) {
      setMapLoaded(true);
    }
  }, [dataLoaded]);

  useEffect(() => {
    console.log('waqiData', waqiData);
  }, [waqiData]);

  /**
   * Starts the Joyride tour if chart=2, data is loaded, and no localStorage visit flag is set.
   */
  useEffect(() => {
    if (dataLoaded) {
      const hasVisited = localStorage.getItem('hasVisited');
      if (!hasVisited) {
        setShowSidebar(true);
        const timer = setTimeout(() => setRunTour(true), 600);
        return () => clearTimeout(timer);
      }
    }
  }, [dataLoaded]);

  /**
   * Fetches WAQI data from the backend endpoint on mount.
   */
  useEffect(() => {
    const token =
      process.env.REACT_APP_WAQI_TOKEN ||
      '5c0b5d3ed39e6f3835ec52a347f4a0243fd7ad6e';
    // Direct WAQI API endpoint
    fetch(
      `https://api.waqi.info/map/bounds?latlng=-85.05112899999966,-190.25546258719436,85.05112877980659,288.47015888445804&token=${token}`,
      { cache: 'no-store' }
    )
      .then((r) => r.json())
      .then((result) => {
        // Filter out items with aqi equal to "-"
        const filteredData = result.data.filter(
          (item: any) => item.aqi !== '-'
        );
        setWaqiData({ ...result, data: filteredData });
        setDataLoaded(true); // <-- mark data as loaded
        setLoading(false);
      })
      .catch((err) => {
        console.error('Initial WAQI fetch error:', err);
        setLoading(false);
      });
  }, []);

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

  const loadingOverlayActive = loading || !mapLoaded;

  // Debounce reference for map moveend callbacks.
  const moveEndTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Memoize handleMapMoveEnd with debounce.
  const handleMapMoveEnd = useCallback((bbox: string) => {
    if (moveEndTimeoutRef.current) {
      clearTimeout(moveEndTimeoutRef.current);
    }
    moveEndTimeoutRef.current = setTimeout(() => {
      const token =
        process.env.REACT_APP_WAQI_TOKEN ||
        '5c0b5d3ed39e6f3835ec52a347f4a0243fd7ad6e';
      fetch(`https://api.waqi.info/map/bounds?latlng=${bbox}&token=${token}`, {
        cache: 'no-store',
      })
        .then((r) => r.json())
        .then((result) => {
          // Only update state if new data is different
          setWaqiData((prevData: any) => {
            if (JSON.stringify(prevData) === JSON.stringify(result)) {
              return prevData;
            }
            return result;
          });
        })
        .catch((err) => {
          console.error('Fetch on map moveend error:', err);
        });
    }, 500);
  }, []);

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
        {error && (
          <Box className="charts" id="message">
            {`Error fetching data: ${error}`}
          </Box>
        )}
        {!dataLoaded && (
          <Box className="charts" id="message">
            Loading data for the first time. This might take a while!
          </Box>
        )}
        <ChartList
          waqiData={waqiData?.data}
          onDataChange={(data) => setWaqiData({ data })}
          onMapMoveEnd={handleMapMoveEnd}
        />
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
              href="https://waqi.info/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'underline', color: '#555' }}
            >
              WAQI
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
