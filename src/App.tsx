import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';

import './theme.css';
import { AirQualityStation, normalizeWaqiStations } from './aqi';
import { computeAqiInsights } from './insights';
import { MapFocusTarget } from './mapFocus';
import { ViewMode } from './viewMode';
import { useMediaQuery } from './hooks/useMediaQuery';
import { useStationDetail } from './hooks/useStationDetail';
import LoadingScreen from './components/LoadingScreen';
import TopBar from './components/TopBar';
import LegalModal from './components/LegalModal';
import MapView from './components/MapView/MapView';
import StationRail from './components/MapView/StationRail';
import StationDetail from './components/StationDetail/StationDetail';
import InsightsView from './components/Insights/InsightsView';

const WORLD_BOUNDS = '-85,-180,85,180';
const REFRESH_INTERVAL_MS = 30 * 60 * 1000;
const BOUNDS_REFRESH_DEBOUNCE_MS = 600;
const LOCAL_BOUNDS_RADIUS_DEGREES = 1.5;

function boundsAround(lat: number, lon: number): string {
  return [
    lat - LOCAL_BOUNDS_RADIUS_DEGREES,
    lon - LOCAL_BOUNDS_RADIUS_DEGREES,
    lat + LOCAL_BOUNDS_RADIUS_DEGREES,
    lon + LOCAL_BOUNDS_RADIUS_DEGREES,
  ].join(',');
}

const App: React.FC = () => {
  const isCompact = useMediaQuery('(max-width: 700px)');
  const [stations, setStations] = useState<AirQualityStation[]>([]);
  const [dataLoaded, setDataLoaded] = useState<boolean>(false);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [railOpen, setRailOpen] = useState<boolean>(false);
  const [railTouched, setRailTouched] = useState<boolean>(false);
  const [detailOpen, setDetailOpen] = useState<boolean>(false);
  const [selectedStation, setSelectedStation] =
    useState<AirQualityStation | null>(null);
  const [focusTarget, setFocusTarget] = useState<MapFocusTarget | null>(null);
  const [isLegalOpen, setIsLegalOpen] = useState<boolean>(false);

  const latestRequestId = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const boundsRefreshTimeoutRef = useRef<number | null>(null);

  const baseUrl = process.env.VITE_WAQI_API_BASE_URL || '/api/waqi';
  const detailState = useStationDetail(selectedStation?.providerId);

  /* Rail follows the viewport until the user takes over. */
  useEffect(() => {
    if (!railTouched) setRailOpen(!isCompact);
  }, [isCompact, railTouched]);

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

  /* Default spotlight: the most polluted representative station. */
  useEffect(() => {
    if (!selectedStation && stations.length) {
      const insights = computeAqiInsights(stations);
      setSelectedStation(
        insights.representativeWorstStation || insights.worstStation
      );
    }
  }, [stations, selectedStation]);

  useEffect(() => {
    if (!locationError) return undefined;
    const timeout = window.setTimeout(() => setLocationError(null), 6000);
    return () => window.clearTimeout(timeout);
  }, [locationError]);

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

  const flyTo = useCallback((lat: number, lon: number, zoom: number) => {
    setFocusTarget((previous) => ({
      lat,
      lon,
      zoom,
      sequence: (previous?.sequence || 0) + 1,
    }));
  }, []);

  const openStationDetail = useCallback(
    (station: AirQualityStation, options?: { fly?: boolean }) => {
      setSelectedStation(station);
      setDetailOpen(true);
      if (options?.fly) {
        flyTo(station.lat, station.lon, 9);
      }
      if (isCompact) {
        setRailOpen(false);
        setRailTouched(true);
      }
    },
    [flyTo, isCompact]
  );

  const handleShowOnMap = useCallback(
    (station: AirQualityStation) => {
      setViewMode('map');
      openStationDetail(station, { fly: true });
    },
    [openStationDetail]
  );

  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Location is not available in this browser.');
      return;
    }

    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setViewMode('map');
        flyTo(latitude, longitude, 8);
        fetchWaqiData(boundsAround(latitude, longitude), true);
      },
      (geoError) => {
        setLocationError(
          geoError.code === geoError.PERMISSION_DENIED
            ? 'Location permission was denied.'
            : 'Could not determine your location.'
        );
      },
      {
        enableHighAccuracy: false,
        maximumAge: 10 * 60 * 1000,
        timeout: 10000,
      }
    );
  }, [fetchWaqiData, flyTo]);

  const hasStations = stations.length > 0;
  const loadingActive = !dataLoaded || !mapLoaded;
  const chromeVisible = dataLoaded && (mapLoaded || viewMode !== 'map');

  return (
    <div className="app">
      <LoadingScreen loading={loadingActive} />

      <TopBar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        stationCount={stations.length}
        railOpen={railOpen}
        onToggleRail={() => {
          setRailTouched(true);
          setRailOpen((prev) => !prev);
        }}
        onUseMyLocation={handleUseMyLocation}
      />

      <div className="view-layer" data-hidden={viewMode !== 'map'}>
        <MapView
          stations={stations}
          focusTarget={focusTarget}
          selectedStationId={detailOpen ? selectedStation?.id || null : null}
          onSelectStation={(station) => openStationDetail(station)}
          onMapLoadEnd={() => setMapLoaded(true)}
          onBoundsChange={handleMapBoundsChange}
        />

        <StationRail
          open={railOpen && viewMode === 'map'}
          stations={stations}
          selectedStationId={selectedStation?.id || null}
          onSelectStation={(station) =>
            openStationDetail(station, { fly: true })
          }
          onClose={() => {
            setRailTouched(true);
            setRailOpen(false);
          }}
        />

        <StationDetail
          open={detailOpen && viewMode === 'map'}
          station={selectedStation}
          detailState={detailState}
          onClose={() => setDetailOpen(false)}
        />

        {dataLoaded && !hasStations && !error && (
          <div className="state-msg">
            No live AQI stations found for the current map area.
          </div>
        )}

        {dataLoaded && !hasStations && error && (
          <div className="state-msg">{`Error loading AQI data: ${error}`}</div>
        )}
      </div>

      {viewMode === 'insights' && (
        <div className="view-layer">
          <InsightsView
            stations={stations}
            selectedStation={selectedStation}
            detailState={detailState}
            onSelectStation={(station) => setSelectedStation(station)}
            onShowOnMap={handleShowOnMap}
          />
        </div>
      )}

      {chromeVisible && (
        <div className="credits">
          <button type="button" onClick={() => setIsLegalOpen(true)}>
            Legal &amp; Privacy
          </button>
          <span>
            AQI data courtesy of{' '}
            <a
              href="https://aqicn.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              WAQI
            </a>
          </span>
        </div>
      )}

      {error && hasStations && (
        <div className="notice" role="status">
          {`Could not refresh AQI data: ${error}. Showing last loaded stations.`}
        </div>
      )}

      {locationError && (
        <div className="notice" role="status">
          {locationError}
        </div>
      )}

      <Analytics />
      <LegalModal open={isLegalOpen} onClose={() => setIsLegalOpen(false)} />
    </div>
  );
};

export default App;
