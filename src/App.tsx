import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import { Box, SelectChangeEvent } from '@mui/material';
import Joyride, { CallBackProps, Step } from 'react-joyride';

import Dropdown from './components/Dropdown/Dropdown';
import ChartList from './components/ChartList/ChartList';
import LoadingOverlay from './assets/LoadingOverlay';
import LegalModal from './components/LegalModal';
import PersistentOverlay from './components/PersistentOverlay';
import { Analytics } from '@vercel/analytics/react';

import tourSteps from './components/tourSteps';

const WAQI_TOKEN = process.env.REACT_APP_WAQI_TOKEN;

const WORLD_BOUNDS = '-85,-180,85,180';

const App: React.FC = () => {
  const [waqiData, setWaqiData] = useState<any[] | null>(null);

  const [initialLoad, setInitialLoad] = useState(true);

  const [isFetchingBounds, setIsFetchingBounds] = useState(false);

  const [mapLoaded, setMapLoaded] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [chart, setChart] = useState<'1' | '2'>('2');

  const [showSidebar, setShowSidebar] = useState(true);

  const [runTour, setRunTour] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);

  const [isLegalOpen, setIsLegalOpen] = useState(false);

  /**
   * @function fetchWaqiData
   * Single function for both initial + bounding fetch
   */
  const fetchWaqiData = useCallback(
    async (bounds: string, isInitial = false) => {
      try {
        if (!isInitial) {
          setIsFetchingBounds(true);
        }
        const url = `https://api.waqi.info/map/bounds?latlng=${bounds}&token=${WAQI_TOKEN}`;
        const resp = await fetch(url);
        const json = await resp.json();
        const filtered = (json.data || []).filter((d: any) => d.aqi !== '-');
        setWaqiData(filtered);
      } catch (err) {
        console.error('WAQI fetch error', err);
        setError('Cannot load WAQI data.');
      } finally {
        if (isInitial) {
          setInitialLoad(false);
        } else {
          setIsFetchingBounds(false);
        }
      }
    },
    []
  );

  /**
   * On mount: fetch entire globe
   */
  useEffect(() => {
    fetchWaqiData(WORLD_BOUNDS, true);
    setSteps(tourSteps);

    // Optionally re-fetch every 30 min
    const intervalId = setInterval(
      () => {
        fetchWaqiData(WORLD_BOUNDS);
      },
      30 * 60 * 1000
    );

    return () => clearInterval(intervalId);
  }, [fetchWaqiData]);

  const allDataLoaded = !initialLoad;
  const loadingOverlayActive = !allDataLoaded || (chart === '2' && !mapLoaded);

  useEffect(() => {
    if (chart !== '2' && allDataLoaded) {
      setMapLoaded(true);
    }
  }, [chart, allDataLoaded]);

  useEffect(() => {
    if (chart === '2' && allDataLoaded) {
      const hasVisited = localStorage.getItem('hasVisited');
      if (!hasVisited) {
        const t = setTimeout(() => setRunTour(true), 800);
        return () => clearTimeout(t);
      }
    }
  }, [chart, allDataLoaded]);

  const handleJoyrideCallback = (info: CallBackProps) => {
    if (info.status === 'finished' || info.status === 'skipped') {
      setTimeout(() => {
        setRunTour(false);
        localStorage.setItem('hasVisited', 'true');
      }, 100);
    }
  };

  const handleSelect = (event: SelectChangeEvent) => {
    if (event.target.name === 'View') {
      setChart(event.target.value as '1' | '2');
    }
  };

  const handleMapFullyIdle = () => {
    setMapLoaded(true);
  };

  const handleMapBoundsChange = useCallback(
    (sw: [number, number], ne: [number, number]) => {
      if (initialLoad) return;
      const [swLng, swLat] = sw;
      const [neLng, neLat] = ne;
      const bounding = `${swLat},${swLng},${neLat},${neLng}`;
      fetchWaqiData(bounding, false);
    },
    [initialLoad, fetchWaqiData]
  );

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
        styles={{ options: { zIndex: 10000 } }}
      />

      <LoadingOverlay
        loading={loadingOverlayActive}
        message="Loading data & map..."
      />

      <Box
        style={{
          position: 'relative',
          height: '100%',
          opacity: loadingOverlayActive ? 0.4 : 1,
          transition: 'opacity 0.3s ease-in-out',
        }}
      >
        {/* Top-left controls */}
        <Box
          style={{
            position: 'absolute',
            top: '10px',
            left: showSidebar && chart === '2' ? '320px' : '70px',
            zIndex: 1,
          }}
        >
          <Dropdown
            handleSelect={handleSelect}
            dataValue={chart}
            dropdown="View"
            className="chart-dropdown"
          />
        </Box>

        {error && (
          <Box className="charts" id="message">
            {`Error: ${error}`}
          </Box>
        )}

        {!initialLoad && waqiData && (
          <ChartList
            locations={waqiData}
            chart={chart}
            showSidebar={showSidebar}
            setShowSidebar={setShowSidebar}
            onMapIdle={handleMapFullyIdle}
            onMapBoundsChange={handleMapBoundsChange}
          />
        )}
      </Box>

      {(mapLoaded || chart === '1') && (
        <Box
          sx={{
            position: 'absolute',
            bottom: '-2px',
            right: '22px',
            zIndex: 9999,
            display: 'flex',
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
            Legal &amp; Privacy
          </Box>
          <Box>
            Data courtesy of{' '}
            <a
              href="https://openaq.org/"
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
