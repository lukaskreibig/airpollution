import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Box,
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
import Plot from 'react-plotly.js';
import mapboxgl, { GeoJSONSource } from 'mapbox-gl';
import type { StyleSpecification } from 'mapbox-gl';
import type { PlotData } from 'plotly.js';
import 'mapbox-gl/dist/mapbox-gl.css';

import {
  AirQualityStation,
  AQI_CATEGORIES,
  aqiColor,
  formatAqi,
} from '../../../aqi';
import Logo from './Logo';
import Legend from './Legend/Legend';
import MiniChart from './MiniChart/MiniChart';
import { useWindowDimensions } from './chartUtilsHelpers/chartUtilsHelpers';

const MAPBOX_ACCESS_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN?.trim();

const FALLBACK_RASTER_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    'carto-light': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        'https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      minzoom: 0,
      maxzoom: 20,
      attribution:
        '&copy; OpenStreetMap contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#eef2f7' },
    },
    {
      id: 'carto-light',
      type: 'raster',
      source: 'carto-light',
      minzoom: 0,
      maxzoom: 22,
    },
  ],
};

const MAP_STYLE: string | StyleSpecification = MAPBOX_ACCESS_TOKEN
  ? 'mapbox://styles/mapbox/light-v11'
  : FALLBACK_RASTER_STYLE;

if (MAPBOX_ACCESS_TOKEN) {
  mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
}

type SortMode = 'aqi' | 'name';
type SortDirection = 'asc' | 'desc';
type MapStatus = 'idle' | 'ready' | 'unsupported' | 'error';

interface ChartProps {
  chart: string;
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

function getMapBoundsString(map: mapboxgl.Map): string {
  const bounds = map.getBounds();
  if (!bounds) return '-85,-180,85,180';
  const southWest = bounds.getSouthWest();
  const northEast = bounds.getNorthEast();
  return [southWest.lat, southWest.lng, northEast.lat, northEast.lng].join(',');
}

const Chart: React.FC<ChartProps> = ({
  chart,
  locations,
  showSidebar,
  setShowSidebar,
  onMapLoadEnd,
  onMapBoundsChange,
}) => {
  const { width, height } = useWindowDimensions();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortMode, setSortMode] = useState<SortMode>('aqi');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [miniChartExpanded, setMiniChartExpanded] = useState<boolean>(true);
  const [activeStationId, setActiveStationId] = useState<string | null>(null);
  const [mapStatus, setMapStatus] = useState<MapStatus>('idle');

  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);

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

  const scatterData = useMemo<Partial<PlotData>[]>(() => {
    if (chart !== '1') return [];
    return [
      {
        type: 'scatter',
        mode: 'markers',
        x: visibleStations.map((station) => station.name),
        y: visibleStations.map((station) => station.aqi),
        text: visibleStations.map(
          (station) =>
            `${station.name}<br>AQI ${station.aqi}<br>${station.category.label}`
        ),
        hoverinfo: 'text',
        marker: {
          color: visibleStations.map((station) => station.category.color),
          size: 12,
          line: { color: '#1f2933', width: 1 },
        },
        name: 'Station AQI',
      },
    ];
  }, [chart, visibleStations]);

  const scatterLayout = useMemo<Partial<Plotly.Layout>>(
    () => ({
      width: Math.max(width - 40, 320),
      height: Math.max(height - 80, 320),
      title: { text: `AQI from ${visibleStations.length} stations` },
      yaxis: { title: { text: 'AQI' }, range: [0, 500] },
      xaxis: {
        showgrid: false,
        showline: false,
        showticklabels: false,
      },
      shapes: AQI_CATEGORIES.slice(0, 5).map((category) => {
        const high = category.range.split('-')[1];
        return {
          type: 'line',
          xref: 'paper',
          x0: 0,
          x1: 1,
          yref: 'y',
          y0: Number(high),
          y1: Number(high),
          line: { color: category.color, width: 1, dash: 'dot' },
        };
      }),
      margin: { l: 60, r: 20, t: 70, b: 40 },
      hovermode: 'closest',
    }),
    [height, visibleStations.length, width]
  );

  const miniChartData = useMemo<Partial<PlotData>[]>(() => {
    if (!locations.length) return [];
    const average =
      locations.reduce((sum, station) => sum + station.aqi, 0) /
      locations.length;
    return [
      {
        type: 'bar',
        x: ['Visible avg'],
        y: [average],
        marker: { color: aqiColor(average) },
        text: [average.toFixed(0)],
        textposition: 'auto',
        hoverinfo: 'y',
      },
    ];
  }, [locations]);

  const miniChartLayout = useMemo<Partial<Plotly.Layout>>(
    () => ({
      width: 280,
      height: 240,
      title: { text: 'Average AQI' },
      margin: { l: 36, r: 20, t: 38, b: 35 },
      yaxis: { range: [0, 500], title: { text: 'AQI' } },
      font: { size: 12 },
    }),
    []
  );

  const updateMapData = useCallback(() => {
    const map = mapRef.current;
    if (!map || mapStatus !== 'ready') return;
    const source = map.getSource('locations-source') as GeoJSONSource;
    source?.setData(buildGeoJSON(locations));
  }, [locations, mapStatus]);

  const initializeMap = useCallback(() => {
    if (chart !== '2' || mapRef.current || !mapContainerRef.current) return;

    const isSupported =
      typeof mapboxgl.supported !== 'function' || mapboxgl.supported();
    if (!isSupported) {
      setMapStatus('unsupported');
      onMapLoadEnd?.();
      return;
    }

    try {
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: MAP_STYLE,
        center: [10, 30],
        zoom: 1.4,
      });

      mapRef.current = map;
      popupRef.current = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
      });

      map.once('error', () => {
        setMapStatus('error');
        onMapLoadEnd?.();
      });

      map.on('load', () => {
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
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
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
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
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
          source.getClusterExpansionZoom(clusterId, (error, zoom) => {
            if (error || typeof zoom !== 'number') return;
            map.easeTo({
              center,
              zoom,
            });
          });
        });

        map.on('moveend', () => {
          onMapBoundsChange?.(getMapBoundsString(map));
        });

        map.addControl(new mapboxgl.NavigationControl(), 'top-right');
        map.addControl(
          new mapboxgl.ScaleControl({ maxWidth: 100, unit: 'metric' }),
          'bottom-left'
        );

        setMapStatus('ready');
        onMapLoadEnd?.();
      });
    } catch {
      setMapStatus('error');
      onMapLoadEnd?.();
    }
  }, [chart, onMapBoundsChange, onMapLoadEnd]);

  useEffect(() => {
    if (chart === '2') {
      initializeMap();
      return;
    }

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      setMapStatus('idle');
    }
  }, [chart, initializeMap]);

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

  return (
    <Box display="flex" sx={{ height: '100%' }}>
      <Drawer
        variant="persistent"
        anchor="left"
        open={showSidebar && chart === '2'}
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

      {showSidebar && chart === '2' && <Box sx={{ width: 300 }} />}

      <Box
        className="charts"
        sx={{ height: '95vh', display: 'flex', flexDirection: 'row' }}
      >
        {chart === '2' && !showSidebar && (
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
          {chart === '2' ? (
            <>
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

              <Legend showSidebar={showSidebar} chart={chart} />
              <MiniChart
                miniChartData={miniChartData}
                miniChartLayout={miniChartLayout}
                miniChartExpanded={miniChartExpanded}
                toggleMiniChart={() =>
                  setMiniChartExpanded((expanded) => !expanded)
                }
              />
            </>
          ) : scatterData.length > 0 ? (
            <Box className="chart-area" sx={{ width: '100%', height: '100%' }}>
              <Plot
                data={scatterData}
                layout={scatterLayout}
                style={{ width: '100%', height: '100%' }}
                useResizeHandler
                config={{ displayModeBar: true, responsive: true }}
              />
            </Box>
          ) : (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
              }}
            >
              <Typography variant="h6">
                No AQI data available to display.
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Chart;
