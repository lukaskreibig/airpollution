import React, { useCallback, useEffect, useRef, useState } from 'react';
import './App.css';
import { Box, SelectChangeEvent } from '@mui/material';
import { Analytics } from '@vercel/analytics/react';

import LoadingOverlay from './assets/LoadingOverlay';
import ChartList from './components/ChartList/ChartList';
import Dropdown from './components/Dropdown/Dropdown';
import LegalModal from './components/LegalModal';
import { AirQualityStation, normalizeWaqiStations } from './aqi';

const WORLD_BOUNDS = '-85,-180,85,180';
const REFRESH_INTERVAL_MS = 30 * 60 * 1000;

const App: React.FC = () => {
  const [stations, setStations] = useState<AirQualityStation[]>([]);
  const [dataLoaded, setDataLoaded] = useState<boolean>(false);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [chart, setChart] = useState<string>('2');
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [isLegalOpen, setIsLegalOpen] = useState<boolean>(false);
  const latestRequestId = useRef<number>(0);

  const baseUrl = process.env.REACT_APP_WAQI_API_BASE_URL || '/api/waqi';

  const fetchWaqiData = useCallback(
    async (bounds: string = WORLD_BOUNDS, showInitialLoading = false) => {
      const requestId = latestRequestId.current + 1;
      latestRequestId.current = requestId;

      if (showInitialLoading) {
        setDataLoaded(false);
      }

      try {
        const response = await fetch(
          `${baseUrl}?latlng=${encodeURIComponent(bounds)}`
        );

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(
            payload?.error || `WAQI request failed (${response.status})`
          );
        }
        if (payload?.status && payload.status !== 'ok') {
          throw new Error(payload.data || 'WAQI returned an error response.');
        }

        const normalizedStations = normalizeWaqiStations(payload);
        if (requestId !== latestRequestId.current) return;

        setStations(normalizedStations);
        setError(null);
      } catch (err: unknown) {
        if (requestId !== latestRequestId.current) return;
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        if (showInitialLoading) {
          setStations([]);
        }
      } finally {
        if (requestId === latestRequestId.current) {
          setDataLoaded(true);
        }
      }
    },
    [baseUrl]
  );

  useEffect(() => {
    fetchWaqiData(WORLD_BOUNDS, true);
    const intervalId = window.setInterval(
      () => fetchWaqiData(WORLD_BOUNDS),
      REFRESH_INTERVAL_MS
    );
    return () => window.clearInterval(intervalId);
  }, [fetchWaqiData]);

  useEffect(() => {
    if (chart !== '2' && dataLoaded) {
      setMapLoaded(true);
    }
  }, [chart, dataLoaded]);

  const handleSelect = (event: SelectChangeEvent) => {
    if (event.target.name === 'View') {
      setChart(event.target.value as string);
    }
  };

  const handleMapBoundsChange = useCallback(
    (bounds: string) => {
      fetchWaqiData(bounds);
    },
    [fetchWaqiData]
  );

  const loadingOverlayActive = !dataLoaded || (chart === '2' && !mapLoaded);
  const linkVisible = dataLoaded && (mapLoaded || chart !== '2');
  const hasStations = stations.length > 0;

  return (
    <div className="App" style={{ height: '90vh', position: 'relative' }}>
      <LoadingOverlay
        loading={loadingOverlayActive}
        message="Loading AQI stations..."
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
          <Dropdown
            handleSelect={handleSelect}
            dataValue={chart}
            dropdown="View"
            className="chart-dropdown"
          />
        </Box>

        {error && !hasStations && (
          <Box className="charts" id="message">
            {`Error loading AQI data: ${error}`}
          </Box>
        )}

        {!error && !dataLoaded && (
          <Box className="charts" id="message">
            Loading live AQI data for the first time. This might take a while.
          </Box>
        )}

        {error && hasStations && (
          <Box
            sx={{
              position: 'absolute',
              top: 70,
              left: showSidebar && chart === '2' ? 320 : 70,
              right: 20,
              zIndex: 2,
              maxWidth: 520,
              p: 1,
              borderRadius: 1,
              backgroundColor: 'rgba(255,255,255,0.9)',
              color: '#7a2e0e',
              fontSize: 13,
            }}
          >
            {`Could not refresh AQI data: ${error}. Showing last loaded stations.`}
          </Box>
        )}

        {dataLoaded && (!error || hasStations) && (
          <ChartList
            locations={stations}
            chart={chart}
            showSidebar={showSidebar}
            setShowSidebar={setShowSidebar}
            onMapLoadEnd={() => setMapLoaded(true)}
            onMapBoundsChange={handleMapBoundsChange}
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
            backgroundColor: 'rgba(255,255,255,0.72)',
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
            AQI data courtesy of{' '}
            <a
              href="https://aqicn.org/"
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
