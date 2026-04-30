import React, { useCallback, useEffect, useRef, useState } from 'react';
import './App.css';
import { Box } from '@mui/material';
import { Analytics } from '@vercel/analytics/react';

import LoadingOverlay from './assets/LoadingOverlay';
import ChartList from './components/ChartList/ChartList';
import Dropdown from './components/Dropdown/Dropdown';
import LegalModal from './components/LegalModal';
import { AirQualityStation, normalizeWaqiStations } from './aqi';
import { ViewMode } from './viewMode';

const WORLD_BOUNDS = '-85,-180,85,180';
const REFRESH_INTERVAL_MS = 30 * 60 * 1000;
const BOUNDS_REFRESH_DEBOUNCE_MS = 600;

const App: React.FC = () => {
  const [stations, setStations] = useState<AirQualityStation[]>([]);
  const [dataLoaded, setDataLoaded] = useState<boolean>(false);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [isLegalOpen, setIsLegalOpen] = useState<boolean>(false);
  const latestRequestId = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const boundsRefreshTimeoutRef = useRef<number | null>(null);

  const baseUrl = process.env.VITE_WAQI_API_BASE_URL || '/api/waqi';

  const fetchWaqiData = useCallback(
    async (bounds: string = WORLD_BOUNDS, showInitialLoading = false) => {
      const requestId = latestRequestId.current + 1;
      latestRequestId.current = requestId;
      abortControllerRef.current?.abort();
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      if (showInitialLoading) {
        setDataLoaded(false);
      }

      try {
        const response = await fetch(
          `${baseUrl}?latlng=${encodeURIComponent(bounds)}`,
          { signal: abortController.signal }
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
        if (err instanceof DOMException && err.name === 'AbortError') return;
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        if (showInitialLoading) {
          setStations([]);
        }
      } finally {
        if (requestId === latestRequestId.current) {
          setDataLoaded(true);
          abortControllerRef.current = null;
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
    return () => {
      window.clearInterval(intervalId);
      abortControllerRef.current?.abort();
    };
  }, [fetchWaqiData]);

  useEffect(() => {
    if (viewMode !== 'map' && dataLoaded) {
      setMapLoaded(true);
    }
  }, [dataLoaded, viewMode]);

  useEffect(() => {
    if (viewMode === 'map') {
      setMapLoaded(false);
    }
  }, [viewMode]);

  const handleSelect = (value: string) => {
    if (value === 'map' || value === 'insights') {
      setViewMode(value);
    }
  };

  const handleMapBoundsChange = useCallback(
    (bounds: string) => {
      if (boundsRefreshTimeoutRef.current) {
        window.clearTimeout(boundsRefreshTimeoutRef.current);
      }
      boundsRefreshTimeoutRef.current = window.setTimeout(() => {
        fetchWaqiData(bounds);
      }, BOUNDS_REFRESH_DEBOUNCE_MS);
    },
    [fetchWaqiData]
  );

  useEffect(
    () => () => {
      if (boundsRefreshTimeoutRef.current) {
        window.clearTimeout(boundsRefreshTimeoutRef.current);
      }
    },
    []
  );

  const loadingOverlayActive =
    !dataLoaded || (viewMode === 'map' && !mapLoaded);
  const linkVisible = dataLoaded && (mapLoaded || viewMode !== 'map');
  const hasStations = stations.length > 0;

  return (
    <div className="App" style={{ height: '100vh', position: 'relative' }}>
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
            top: '16px',
            left: showSidebar && viewMode === 'map' ? '320px' : '70px',
            zIndex: 1,
          }}
        >
          <Dropdown
            handleSelect={handleSelect}
            dataValue={viewMode}
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
              left: showSidebar && viewMode === 'map' ? 320 : 70,
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
            viewMode={viewMode}
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
