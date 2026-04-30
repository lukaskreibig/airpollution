import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Box,
  Chip,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { CloseCircleOutlined, MenuOutlined } from '@ant-design/icons';
import maplibregl, { GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import {
  AirQualityStation,
  AQI_CATEGORIES,
  aqiColor,
  formatAqi,
} from '../../../aqi';
import { computeAqiInsights } from '../../../insights';
import { ViewMode } from '../../../viewMode';
import InsightsDashboard from '../../InsightsDashboard/InsightsDashboard';
import Logo from './Logo';
import Legend from './Legend/Legend';

const MAPTILER_API_KEY = process.env.VITE_MAPTILER_API_KEY?.trim();
const MAPTILER_STYLE_ID =
  process.env.VITE_MAPTILER_STYLE_ID?.trim() || 'dataviz-light';

const OPENFREEMAP_VECTOR_STYLE =
  'https://tiles.openfreemap.org/styles/positron';

const MAP_STYLE = MAPTILER_API_KEY
  ? `https://api.maptiler.com/maps/${encodeURIComponent(
      MAPTILER_STYLE_ID
    )}/style.json?key=${encodeURIComponent(MAPTILER_API_KEY)}`
  : OPENFREEMAP_VECTOR_STYLE;

type SortMode = 'aqi' | 'name';
type SortDirection = 'asc' | 'desc';
type MapStatus = 'idle' | 'ready' | 'unsupported' | 'error';

interface ChartProps {
  viewMode: ViewMode;
  locations: AirQualityStation[];
  showSidebar: boolean;
  setShowSidebar: React.Dispatch<React.SetStateAction<boolean>>;
  onMapLoadEnd?: () => void;
  onMapBoundsChange?: (bounds: string) => void;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function stationPopupHtml(station: AirQualityStation): string {
  return `
    <div style="font-size:14px;line-height:1.45;max-width:240px;">
      <strong>${escapeHtml(station.name)}</strong><br/>
      AQI: <span style="color:${station.category.color};font-weight:bold;">${station.aqi}</span><br/>
      <span>${escapeHtml(station.category.label)}</span><br/>
      <span style="font-size:12px;color:#555;">${escapeHtml(station.category.healthMessage)}</span><br/>
      ${
        station.updatedAt
          ? `<span style="font-size:11px;color:gray;">Updated: <b>${escapeHtml(
              station.updatedAt
            )}</b></span><br/>`
          : ''
      }
      <span style="font-size:11px;color:gray;">Source: ${station.source}</span>
    </div>
  `;
}

function buildGeoJSON(
  stations: AirQualityStation[]
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: 'FeatureCollection',
    features: stations.map((station) => ({
      type: 'Feature',
      id: station.id,
      geometry: {
        type: 'Point',
        coordinates: [station.lon, station.lat],
      },
      properties: {
        stationId: station.id,
        name: station.name,
        aqi: station.aqi,
        label: formatAqi(station.aqi),
        color: aqiColor(station.aqi),
        popupHTML: stationPopupHtml(station),
      },
    })),
  };
}

function getMapBoundsString(map: maplibregl.Map): string {
  const bounds = map.getBounds();
  if (!bounds) return '-85,-180,85,180';
  const southWest = bounds.getSouthWest();
  const northEast = bounds.getNorthEast();
  return [southWest.lat, southWest.lng, northEast.lat, northEast.lng].join(',');
}

function canCreateWebGlContext(): boolean {
  if (typeof document === 'undefined') return true;

  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')
    );
  } catch {
    return false;
  }
}

const Chart: React.FC<ChartProps> = ({
  viewMode,
  locations,
  showSidebar,
  setShowSidebar,
  onMapLoadEnd,
  onMapBoundsChange,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortMode, setSortMode] = useState<SortMode>('aqi');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [activeStationId, setActiveStationId] = useState<string | null>(null);
  const [mapStatus, setMapStatus] = useState<MapStatus>('idle');

  const mapRef = useRef<maplibregl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);

  const visibleStations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = query
      ? locations.filter((station) =>
          station.name.toLowerCase().includes(query)
        )
      : locations;

    return [...filtered].sort((a, b) => {
      if (sortMode === 'name') {
        const comparison = a.name.localeCompare(b.name);
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      return sortDirection === 'asc' ? a.aqi - b.aqi : b.aqi - a.aqi;
    });
  }, [locations, searchQuery, sortDirection, sortMode]);

  const insights = useMemo(() => computeAqiInsights(locations), [locations]);

  const updateMapData = useCallback(() => {
    const map = mapRef.current;
    if (!map || mapStatus !== 'ready') return;
    const source = map.getSource('locations-source') as GeoJSONSource;
    source?.setData(buildGeoJSON(locations));
  }, [locations, mapStatus]);

  const initializeMap = useCallback(() => {
    if (viewMode !== 'map' || mapRef.current || !mapContainerRef.current) {
      return;
    }

    if (!canCreateWebGlContext()) {
      setMapStatus('unsupported');
      onMapLoadEnd?.();
      return;
    }

    try {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: MAP_STYLE,
        center: [10, 30],
        zoom: 1.4,
      });

      mapRef.current = map;
      let mapHasLoaded = false;
      popupRef.current = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
      });

      map.on('error', () => {
        if (!mapHasLoaded) {
          setMapStatus('error');
          onMapLoadEnd?.();
        }
      });

      map.on('load', () => {
        mapHasLoaded = true;
        map.addSource('locations-source', {
          type: 'geojson',
          data: buildGeoJSON([]),
          cluster: true,
          clusterMaxZoom: 5,
          clusterRadius: 36,
          clusterProperties: {
            sumAQI: ['+', ['to-number', ['get', 'aqi']]],
          },
        });

        map.addLayer({
          id: 'clusters',
          type: 'circle',
          source: 'locations-source',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': [
              'step',
              ['/', ['get', 'sumAQI'], ['get', 'point_count']],
              AQI_CATEGORIES[0].color,
              51,
              AQI_CATEGORIES[1].color,
              101,
              AQI_CATEGORIES[2].color,
              151,
              AQI_CATEGORIES[3].color,
              201,
              AQI_CATEGORIES[4].color,
              301,
              AQI_CATEGORIES[5].color,
            ],
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              17,
              20,
              22,
              80,
              28,
            ],
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1,
          },
        });

        map.addLayer({
          id: 'cluster-label',
          type: 'symbol',
          source: 'locations-source',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': [
              'to-string',
              ['round', ['/', ['get', 'sumAQI'], ['get', 'point_count']]],
            ],
            'text-size': 12,
            'text-font': ['Noto Sans Bold'],
          },
          paint: {
            'text-color': '#ffffff',
            'text-halo-color': '#1f2933',
            'text-halo-width': 1,
          },
        });

        map.addLayer({
          id: 'station-point',
          type: 'circle',
          source: 'locations-source',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-radius': 11,
            'circle-color': ['get', 'color'],
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1.5,
          },
        });

        map.addLayer({
          id: 'station-highlight',
          type: 'circle',
          source: 'locations-source',
          filter: ['==', ['get', 'stationId'], ''],
          paint: {
            'circle-radius': 17,
            'circle-color': 'rgba(0,0,0,0)',
            'circle-stroke-color': '#111827',
            'circle-stroke-width': 2,
          },
        });

        map.addLayer({
          id: 'station-label',
          type: 'symbol',
          source: 'locations-source',
          filter: ['!', ['has', 'point_count']],
          layout: {
            'text-field': ['get', 'label'],
            'text-size': 10,
            'text-font': ['Noto Sans Bold'],
          },
          paint: {
            'text-color': '#ffffff',
            'text-halo-color': '#1f2933',
            'text-halo-width': 1,
          },
        });

        const popup = popupRef.current;
        map.on('mouseenter', 'station-point', (event) => {
          map.getCanvas().style.cursor = 'pointer';
          const feature = event.features?.[0];
          if (!feature) return;
          const stationId = feature.properties?.stationId;
          if (typeof stationId === 'string') setActiveStationId(stationId);
          popup
            ?.setLngLat(event.lngLat)
            .setHTML(feature.properties?.popupHTML || '')
            .addTo(map);
        });

        map.on('mouseleave', 'station-point', () => {
          map.getCanvas().style.cursor = '';
          popup?.remove();
          setActiveStationId(null);
        });

        map.on('click', 'clusters', (event) => {
          const feature = event.features?.[0];
          const clusterId = feature?.properties?.cluster_id;
          const source = map.getSource('locations-source') as GeoJSONSource;
          if (
            !feature ||
            typeof clusterId !== 'number' ||
            !source.getClusterExpansionZoom
          ) {
            return;
          }
          const center = (feature.geometry as GeoJSON.Point).coordinates as [
            number,
            number,
          ];
          source
            .getClusterExpansionZoom(clusterId)
            .then((zoom) => {
              if (typeof zoom !== 'number') return;
              map.easeTo({
                center,
                zoom,
              });
            })
            .catch(() => undefined);
        });

        map.on('moveend', () => {
          onMapBoundsChange?.(getMapBoundsString(map));
        });

        map.addControl(new maplibregl.NavigationControl(), 'top-right');
        map.addControl(
          new maplibregl.ScaleControl({ maxWidth: 100, unit: 'metric' }),
          'bottom-left'
        );

        setMapStatus('ready');
        onMapLoadEnd?.();
      });
    } catch {
      setMapStatus('error');
      onMapLoadEnd?.();
    }
  }, [onMapBoundsChange, onMapLoadEnd, viewMode]);

  useEffect(() => {
    if (viewMode === 'map') {
      initializeMap();
      return;
    }

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      setMapStatus('idle');
    }
  }, [initializeMap, viewMode]);

  useEffect(() => {
    updateMapData();
  }, [updateMapData]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || mapStatus !== 'ready') return;
    map.setFilter('station-highlight', [
      '==',
      ['get', 'stationId'],
      activeStationId || '',
    ]);
  }, [activeStationId, mapStatus]);

  const handleStationSelect = (station: AirQualityStation) => {
    setActiveStationId(station.id);
    const map = mapRef.current;
    if (!map || mapStatus !== 'ready') return;

    map.easeTo({
      center: [station.lon, station.lat],
      zoom: Math.max(map.getZoom(), 8),
      duration: 500,
    });
    popupRef.current
      ?.setLngLat([station.lon, station.lat])
      .setHTML(stationPopupHtml(station))
      .addTo(map);
  };

  const toggleSidebar = () => {
    setShowSidebar((prev) => {
      const next = !prev;
      window.setTimeout(() => mapRef.current?.resize(), 300);
      return next;
    });
  };

  const mapFallbackMessage =
    mapStatus === 'unsupported'
      ? 'This browser or device does not support the WebGL map. Live AQI station data is still available in the list.'
      : 'The map could not be initialized. Live AQI station data is still available in the list.';

  if (viewMode === 'insights') {
    return <InsightsDashboard stations={locations} />;
  }

  return (
    <Box display="flex" sx={{ height: '100%' }}>
      <Drawer
        variant="persistent"
        anchor="left"
        open={showSidebar}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '100%', sm: 300 },
            boxSizing: 'border-box',
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
          <Logo />
        </Box>

        <Box
          sx={{
            p: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            flex: 1,
            minHeight: 0,
          }}
        >
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              label="Search"
              variant="outlined"
              size="small"
              fullWidth
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="search-field"
            />
            <FormControl
              size="small"
              variant="outlined"
              className="choose-sort"
              sx={{ minWidth: 96 }}
            >
              <InputLabel>Sort</InputLabel>
              <Select
                label="Sort"
                value={sortMode}
                onChange={(event) =>
                  setSortMode(event.target.value as SortMode)
                }
              >
                <MenuItem value="aqi">AQI</MenuItem>
                <MenuItem value="name">Name</MenuItem>
              </Select>
            </FormControl>
            <IconButton
              size="small"
              edge="start"
              onClick={() =>
                setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
              }
              className="sort-select"
              aria-label="Toggle sort direction"
            >
              {sortDirection === 'asc' ? '▲' : '▼'}
            </IconButton>
            <IconButton
              size="medium"
              onClick={toggleSidebar}
              className="close-list"
              aria-label="Close station list"
            >
              <CloseCircleOutlined />
            </IconButton>
          </Box>

          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Showing {visibleStations.length} of {locations.length} live AQI
            stations. Default sorting shows the highest AQI first.
          </Typography>

          <List dense sx={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {visibleStations.map((station) => (
              <ListItem
                key={station.id}
                component="li"
                onMouseEnter={() => setActiveStationId(station.id)}
                onMouseLeave={() => setActiveStationId(null)}
                onClick={() => handleStationSelect(station)}
                sx={{
                  backgroundColor: `${station.category.color}24`,
                  borderLeft: `5px solid ${station.category.color}`,
                  borderRadius: 1,
                  mb: 1,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s, transform 0.2s',
                  transform:
                    activeStationId === station.id ? 'translateX(2px)' : 'none',
                  '&:hover': {
                    backgroundColor: `${station.category.color}3d`,
                  },
                }}
                role="button"
              >
                <ListItemText
                  secondaryTypographyProps={{ component: 'div' }}
                  primary={
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        gap: 1,
                        alignItems: 'center',
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 700, lineHeight: 1.2 }}
                      >
                        {station.name}
                      </Typography>
                      <Box
                        sx={{
                          minWidth: 44,
                          textAlign: 'center',
                          px: 1,
                          py: 0.4,
                          borderRadius: 1,
                          fontWeight: 700,
                          color: station.category.foreground,
                          backgroundColor: station.category.color,
                        }}
                      >
                        {station.aqi}
                      </Box>
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'grid', gap: 0.25, mt: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>
                        {station.category.label}
                      </Typography>
                      <Typography variant="caption">
                        {station.category.healthMessage}
                      </Typography>
                      {station.updatedAt && (
                        <Typography variant="caption" color="text.secondary">
                          Updated: {station.updatedAt}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary">
                        Source: {station.source}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {showSidebar && <Box sx={{ width: 300 }} />}

      <Box
        className="charts"
        sx={{ height: '100%', display: 'flex', flexDirection: 'row' }}
      >
        {!showSidebar && (
          <IconButton
            onClick={toggleSidebar}
            sx={{
              position: 'fixed',
              top: 40,
              left: 35,
              borderRadius: 2,
              borderStyle: 'solid',
              borderWidth: 0.5,
              zIndex: 1300,
              backgroundColor: 'rgba(255,255,255,0.9)',
              '&:hover': { backgroundColor: 'rgba(255,255,255,1)' },
            }}
            className="sidebar-toggle-button"
            aria-label="Open station list"
          >
            <MenuOutlined />
          </IconButton>
        )}

        <Box sx={{ flex: 1, height: '100%', position: 'relative' }}>
          {(mapStatus === 'unsupported' || mapStatus === 'error') && (
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 3,
                textAlign: 'center',
                backgroundColor: '#eef2f7',
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Map unavailable
                </Typography>
                <Typography>{mapFallbackMessage}</Typography>
              </Box>
            </Box>
          )}

          {mapStatus !== 'unsupported' && mapStatus !== 'error' && (
            <div
              ref={mapContainerRef}
              className="map-area"
              style={{ width: '100%', height: '100%' }}
            />
          )}

          <Legend showSidebar={showSidebar} />
          <Box
            className="aqi-summary"
            sx={{
              position: 'absolute',
              right: 18,
              bottom: 34,
              zIndex: 2,
              display: 'grid',
              gap: 1,
              width: { xs: 230, sm: 280 },
              p: 1.5,
              borderRadius: 2,
              backgroundColor: 'rgba(255,255,255,0.92)',
              boxShadow: '0 10px 28px rgba(15, 23, 42, 0.14)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Live AQI summary
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 1,
              }}
            >
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>
                  {formatAqi(insights.averageAqi)}
                </Typography>
                <Typography variant="caption">Average</Typography>
              </Box>
              <Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 900,
                    color: insights.worstStation?.category.color,
                  }}
                >
                  {formatAqi(insights.worstStation?.aqi)}
                </Typography>
                <Typography variant="caption">Worst</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              <Chip
                size="small"
                label={`${insights.stationCount} stations`}
                sx={{ borderRadius: 1, fontWeight: 700 }}
              />
              <Chip
                size="small"
                label={`${insights.unhealthyCount} unhealthy+`}
                sx={{
                  borderRadius: 1,
                  fontWeight: 700,
                  backgroundColor: '#cc003324',
                }}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Chart;
