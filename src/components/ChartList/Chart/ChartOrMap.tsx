/* -------------------------------------------------------------------------- */
/* ChartOrMap.tsx – FULL COMPONENT                                            */
/* -------------------------------------------------------------------------- */
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  Box,
  Drawer,
  IconButton,
  ListItem,
  ListItemText,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { MenuOutlined } from '@ant-design/icons';
import Plot from 'react-plotly.js';
import mapboxgl, {
  GeoJSONSource,
  LngLatBounds,
  FilterSpecification,
} from 'mapbox-gl';
import Logo from './Logo';
import Legend from './Legend/Legend';
import MiniChart from './MiniChart/MiniChart';
import {
  calculateBigChart,
  calculateBigLayout,
  calculateAverageChart,
} from './ChartFunction';
import {
  aqiColor,
  AQI_BREAKPOINTS,
  useWindowDimensions,
} from './chartUtilsHelpers/chartUtilsHelpers';
import './sidebarTransitions.css';
import { TransitionGroup, CSSTransition } from 'react-transition-group';

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || '';

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */
interface StationData {
  lat: number;
  lon: number;
  aqi: string;
  station?: { name?: string; time?: string };
}
interface LocalPoint {
  id: number;
  name: string;
  lat: number;
  lon: number;
  aqi: number;
  timestamp?: string;
  popupHTML: string;
}
interface ChartOrMapProps {
  chart: string;
  locations: StationData[];
  showSidebar: boolean;
  setShowSidebar: React.Dispatch<React.SetStateAction<boolean>>;
  onMapIdle?: () => void;
  onMapBoundsChange?: (sw: [number, number], ne: [number, number]) => void;
}

/* -------------------------------------------------------------------------- */
/*                               COMPONENT                                    */
/* -------------------------------------------------------------------------- */
const ChartOrMap: React.FC<ChartOrMapProps> = ({
  chart,
  locations,
  showSidebar,
  setShowSidebar,
  onMapIdle,
  onMapBoundsChange,
}) => {
  const { width, height } = useWindowDimensions();

  /* ---------- state / refs ---------- */
  const [revision, setRevision] = useState(0);
  const [miniChartData, setMiniChartData] = useState<{ aqi: number }[]>([]);
  const [miniChartLayout, setMiniChartLayout] = useState<any>({});
  const [miniChartExpanded, setMiniChartExpanded] = useState(true);

  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  const [mapIsIdle, setMapIsIdle] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<'name' | 'aqi'>('aqi');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [points, setPoints] = useState<LocalPoint[]>([]);
  const listRefs = useRef<Record<number, HTMLLIElement | null>>({});

  /* -------- helper: scroll sidebar to list item (only on map hover) ------- */
  const scrollIntoViewIfNeeded = (id: number) => {
    const el = listRefs.current[id];
    if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };

  /* ---------------------------------------------------------------------- */
  /*                            DATA → points                               */
  /* ---------------------------------------------------------------------- */
  useEffect(() => {
    const arr: LocalPoint[] = locations
      .map((loc, i) => {
        const aqiNum = parseInt(loc.aqi, 10);
        if (!loc.lat || !loc.lon || Number.isNaN(aqiNum) || aqiNum < 0)
          return null;
        const stationName = loc.station?.name || `Station #${i + 1}`;
        const updated = loc.station?.time
          ? new Date(loc.station.time).toLocaleString()
          : '';
        return {
          id: i,
          name: stationName,
          lat: loc.lat,
          lon: loc.lon,
          aqi: aqiNum,
          timestamp: updated,
          popupHTML: `<div style="font-size:14px;line-height:1.4;">
            <strong>${stationName}</strong><br/>
            AQI: <span style="color:${aqiColor(
              aqiNum
            )};font-weight:bold;">${aqiNum}</span><br/>
            ${
              updated
                ? `<span style="font-size:11px;color:gray;">Last Update: <b>${updated}</b></span>`
                : ''
            }
          </div>`,
        };
      })
      .filter(Boolean) as LocalPoint[];
    setPoints(arr);
  }, [locations]);

  /* ---------------------------------------------------------------------- */
  /*                           MAP INITIALISATION                           */
  /* ---------------------------------------------------------------------- */
  useEffect(() => {
    if (chart !== '2' || mapRef.current || !mapContainerRef.current) return;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v10',
      center: [0, 0],
      zoom: 2,
    });
    mapRef.current = map;
    popupRef.current = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
    });

    map.on('load', () => {
      /* ---------- source ---------- */
      map.addSource('locations-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterMaxZoom: 4,
        clusterRadius: 30,
        clusterProperties: {
          sumAQI: ['+', ['coalesce', ['to-number', ['get', 'overallAQI']], 0]],
        },
      });

      /* ---------- layers ---------- */
      map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'locations-source',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-radius': 11,
          'circle-color': ['get', 'overallColor'],
          'circle-stroke-color': '#000',
          'circle-stroke-width': 1,
        },
      });

      /* Highlight circle **after** base circle but **before** label */
      map.addLayer(
        {
          id: 'highlight-point',
          type: 'circle',
          source: 'locations-source',
          filter: ['==', ['get', 'sid'], -1],
          paint: {
            'circle-radius': 17,
            'circle-color': ['get', 'overallColor'],
            'circle-opacity': 0, // transparent fill
            'circle-stroke-color': '#000000',
            'circle-stroke-width': 1.5,
          },
        },
        'unclustered-point'
      );

      map.addLayer({
        id: 'unclustered-label',
        type: 'symbol',
        source: 'locations-source',
        filter: ['!', ['has', 'point_count']],
        layout: { 'text-field': ['get', 'overallAQI'], 'text-size': 10 },
        paint: {
          'text-color': '#fff',
          'text-halo-color': '#000',
          'text-halo-width': 1,
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
            '#009966',
            50,
            '#009966',
            100,
            '#ffde33',
            150,
            '#ff9933',
            200,
            '#cc0033',
            300,
            '#660099',
            9999,
            '#7e0023',
          ],
          'circle-radius': 15,
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
        },
        paint: {
          'text-color': '#fff',
          'text-halo-color': '#000',
          'text-halo-width': 1,
        },
      });

      /* ------- map hover → sidebar highlight ------- */
      map.on('mouseenter', 'unclustered-point', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        const feat = e.features?.[0];
        if (!feat) return;
        const html = feat.properties?.popupHTML || '';
        popupRef.current?.setLngLat(e.lngLat).setHTML(html).addTo(map);
        const id = feat.properties?.sid;
        if (typeof id === 'number') {
          setActiveId(id);
          scrollIntoViewIfNeeded(id);
        }
      });
      map.on('mouseleave', 'unclustered-point', () => {
        map.getCanvas().style.cursor = '';
        popupRef.current?.remove();
        setActiveId(null);
      });
    });

    map.once('idle', () => {
      setMapIsIdle(true);
      onMapIdle?.();
    });

    /* bounding fetch */
    map.on('moveend', () => {
      if (!mapRef.current || !onMapBoundsChange) return;
      const b: LngLatBounds | null = map.getBounds() as any;
      if (!b) return;
      const sw: [number, number] = [b.getSouthWest().lng, b.getSouthWest().lat];
      const ne: [number, number] = [b.getNorthEast().lng, b.getNorthEast().lat];
      onMapBoundsChange(sw, ne);
    });
  }, [chart, onMapIdle, onMapBoundsChange]);

  /* highlight circle filter update */
  useEffect(() => {
    if (!mapRef.current?.isStyleLoaded()) return;
    const map = mapRef.current;
    const filter: FilterSpecification =
      activeId === null
        ? ['==', ['get', 'sid'], -1]
        : ['==', ['get', 'sid'], activeId];
    map.setFilter('highlight-point', filter);
  }, [activeId]);

  /* ---------------------------------------------------------------------- */
  /*                 GEOJSON (updates when points change)                   */
  /* ---------------------------------------------------------------------- */
  const createGeoJSON = useCallback(
    (arr: LocalPoint[]) =>
      ({
        type: 'FeatureCollection',
        features: arr.map((p) => ({
          type: 'Feature',
          id: p.id,
          geometry: { type: 'Point', coordinates: [p.lon, p.lat] },
          properties: {
            sid: p.id,
            overallColor: aqiColor(p.aqi),
            overallAQI: p.aqi < 0 ? '?' : String(p.aqi),
            popupHTML: p.popupHTML,
          },
        })),
      }) as GeoJSON.FeatureCollection<GeoJSON.Geometry>,
    []
  );

  useEffect(() => {
    if (!mapIsIdle || chart !== '2' || !points.length || !mapRef.current)
      return;
    const src = mapRef.current.getSource('locations-source') as GeoJSONSource;
    src.setData(createGeoJSON(points));
    mapRef.current.resize();
  }, [mapIsIdle, chart, points, createGeoJSON]);

  /* ---------------------------------------------------------------------- */
  /*                        SCATTER & MINI-CHARTS                           */
  /* ---------------------------------------------------------------------- */
  const [scatterData, setScatterData] = useState<any[]>([]);
  const [scatterLayout, setScatterLayout] = useState<any>({});

  useEffect(() => {
    if (chart !== '1' || !points.length) {
      setScatterData([]);
      setScatterLayout({});
      return;
    }
    const sData = calculateBigChart(chart, locations);
    const layout = calculateBigLayout(chart, locations, width, height);
    layout.shapes = AQI_BREAKPOINTS.map((b) => ({
      type: 'line',
      xref: 'paper',
      x0: 0,
      x1: 1,
      yref: 'y',
      y0: b.value,
      y1: b.value,
      line: { color: aqiColor(b.value), width: 2, dash: 'dash' },
    }));
    layout.annotations = (layout.annotations || []).concat(
      AQI_BREAKPOINTS.map((b) => ({
        xref: 'paper',
        x: 1.01,
        yref: 'y',
        y: b.value,
        xanchor: 'left',
        yanchor: 'middle',
        showarrow: false,
        text: `${b.label} (${b.value}+)`,
        font: { size: 11, color: aqiColor(b.value) },
      }))
    );
    layout.annotations.push({
      text: 'Hover over any circle to see station info',
      x: 0,
      y: 1.1,
      xref: 'paper',
      yref: 'paper',
      showarrow: false,
      font: { size: 14, color: '#555' },
    });
    setScatterData(sData);
    setScatterLayout(layout);
    setRevision((r) => r + 1);
  }, [chart, points, locations, width, height]);

  useEffect(() => {
    if (chart !== '2' || !points.length) {
      setMiniChartData([]);
      setMiniChartLayout({});
      return;
    }
    const { data: groupedData } = calculateAverageChart(points);
    if (!groupedData.length) {
      setMiniChartData([]);
      setMiniChartLayout({});
      return;
    }
    setMiniChartData(groupedData);
    setMiniChartLayout({
      width: 280,
      height: 240,
      title: { text: 'Map AQI' },
      margin: { l: 30, r: 20, t: 40, b: 30 },
    });
  }, [chart, points]);

  /* ---------------------------------------------------------------------- */
  /*                              LIST FILTER                                */
  /* ---------------------------------------------------------------------- */
  const displayedPoints = useMemo(() => {
    let filtered = points;
    const q = searchQuery.trim().toLowerCase();
    if (q) filtered = filtered.filter((p) => p.name.toLowerCase().includes(q));
    filtered =
      sortMode === 'aqi'
        ? [...filtered].sort((a, b) =>
            sortDirection === 'asc' ? a.aqi - b.aqi : b.aqi - a.aqi
          )
        : [...filtered].sort((a, b) =>
            sortDirection === 'asc'
              ? a.name.localeCompare(b.name)
              : b.name.localeCompare(a.name)
          );
    return filtered;
  }, [points, searchQuery, sortMode, sortDirection]);

  /* ---------------------------------------------------------------------- */
  /*                                 RENDER                                  */
  /* ---------------------------------------------------------------------- */
  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
      {/* -------- Sidebar -------- */}
      <Drawer
        variant="persistent"
        anchor="left"
        open={showSidebar && chart === '2'}
        sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: 300 } } }}
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
          }}
        >
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              label="Search"
              size="small"
              sx={{ flex: 1 }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <FormControl size="small" sx={{ minWidth: 90 }}>
              <InputLabel>Sort</InputLabel>
              <Select
                label="Sort"
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as 'name' | 'aqi')}
              >
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="aqi">AQI</MenuItem>
              </Select>
            </FormControl>
            <IconButton
              size="small"
              onClick={() =>
                setSortDirection((p) => (p === 'asc' ? 'desc' : 'asc'))
              }
            >
              {sortDirection === 'asc' ? '▲' : '▼'}
            </IconButton>
          </Box>

          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            <TransitionGroup component={null}>
              {displayedPoints.map((p) => (
                <CSSTransition key={p.id} timeout={300} classNames="fade">
                  <ListItem
                    ref={(el) => (listRefs.current[p.id] = el)}
                    onMouseEnter={() => setActiveId(p.id)}
                    onMouseLeave={() => setActiveId(null)}
                    onClick={() => {
                      /* jump to point & open popup */
                      setActiveId(p.id);
                      if (mapRef.current) {
                        mapRef.current.easeTo({
                          center: [p.lon, p.lat],
                          zoom: Math.max(mapRef.current.getZoom(), 7),
                        });
                        popupRef.current
                          ?.setLngLat([p.lon, p.lat])
                          .setHTML(p.popupHTML)
                          .addTo(mapRef.current);
                      }
                    }}
                    sx={{
                      backgroundColor:
                        activeId === p.id
                          ? `${aqiColor(p.aqi)}66`
                          : `${aqiColor(p.aqi)}33`,
                      borderRadius: 2,
                      mb: 1,
                      cursor: 'pointer',
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ fontWeight: 'bold' }}>
                          {p.name}
                          <span style={{ float: 'right' }}>
                            {p.aqi < 0 ? '?' : p.aqi}
                          </span>
                        </Box>
                      }
                      secondary={
                        p.timestamp && (
                          <Typography variant="caption">
                            Last Update: {p.timestamp}
                          </Typography>
                        )
                      }
                    />
                  </ListItem>
                </CSSTransition>
              ))}
            </TransitionGroup>
          </Box>
        </Box>
      </Drawer>
      {showSidebar && chart === '2' && <Box sx={{ width: 300 }} />}

      {/* -------- Main -------- */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        <Box
          ref={mapContainerRef}
          sx={{
            width: '100%',
            height: '100%',
            display: chart === '2' ? 'block' : 'none',
          }}
        />

        {chart === '1' && (
          <>
            {scatterData.length ? (
              <Plot
                data={scatterData}
                layout={scatterLayout}
                revision={revision}
                style={{ width: '100%', height: '100%' }}
                useResizeHandler
                config={{ displayModeBar: true, responsive: true }}
              />
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                }}
              >
                <Typography>No data available for scatter plot.</Typography>
              </Box>
            )}
          </>
        )}

        {chart === '2' && (
          <>
            {!showSidebar && (
              <IconButton
                onClick={() => setShowSidebar(true)}
                sx={{
                  position: 'fixed',
                  top: 40,
                  left: 40,
                  zIndex: 1300,
                  backgroundColor: 'rgba(255,255,255,0.8)',
                  border: '1px solid #ccc',
                  borderRadius: 2,
                }}
              >
                <MenuOutlined />
              </IconButton>
            )}
            <Legend showSidebar={showSidebar} chart={chart} />
            <MiniChart
              miniChartData={miniChartData}
              miniChartLayout={miniChartLayout}
              miniChartExpanded={miniChartExpanded}
              toggleMiniChart={() => setMiniChartExpanded((p) => !p)}
            />
          </>
        )}
      </Box>
    </Box>
  );
};

export default ChartOrMap;
