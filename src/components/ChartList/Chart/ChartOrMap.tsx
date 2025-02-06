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
  List,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { MenuOutlined, CloseCircleOutlined } from '@ant-design/icons';
import Plot from 'react-plotly.js';
import mapboxgl, { GeoJSONSource } from 'mapbox-gl';

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

interface StationData {
  lat: number;
  lon: number;
  aqi: string;
  station?: {
    name?: string;
    time?: string;
  };
}

interface LocalPoint {
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

const ChartOrMap: React.FC<ChartOrMapProps> = ({
  chart,
  locations,
  showSidebar,
  setShowSidebar,
  onMapIdle,
  onMapBoundsChange,
}) => {
  const { width, height } = useWindowDimensions();
  const [revision, setRevision] = useState(0);

  const [miniChartData, setMiniChartData] = useState<{ aqi: number }[]>([]);
  const [miniChartLayout, setMiniChartLayout] = useState<any>({});
  const [miniChartExpanded, setMiniChartExpanded] = useState(true);

  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  const [mapIsIdle, setMapIsIdle] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<'name' | 'aqi'>('aqi');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [points, setPoints] = useState<LocalPoint[]>([]);

  useEffect(() => {
    const arr = locations
      .map((loc) => {
        const aqiNum = parseInt(loc.aqi, 10);
        if (!loc.lat || !loc.lon || isNaN(aqiNum) || aqiNum < 0) return null;

        const stationName = loc.station?.name || 'Unknown';
        const updated = loc.station?.time
          ? new Date(loc.station.time).toLocaleString()
          : '';

        const popupHTML = `
          <div style="font-size:14px;line-height:1.4;">
            <strong>${stationName}</strong><br/>
            AQI: <span style="color:${aqiColor(aqiNum)};font-weight:bold;">${aqiNum}</span><br/>
            ${
              updated
                ? `<span style="font-size:11px; color:gray;">Last Update: <b>${updated}</b></span>`
                : ''
            }
          </div>
        `;
        return {
          name: stationName,
          lat: loc.lat,
          lon: loc.lon,
          aqi: aqiNum,
          timestamp: updated,
          popupHTML,
        };
      })
      .filter(Boolean) as LocalPoint[];
    setPoints(arr);
  }, [locations]);

  useEffect(() => {
    if (chart !== '2') return;
    if (mapRef.current || !mapContainerRef.current) return;

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
          'circle-opacity-transition': { duration: 600, delay: 0 },
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
          'text-offset': [0, 0.0],
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 1,
        },
      });

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
          'circle-opacity': 0.9,
          'circle-opacity-transition': { duration: 600, delay: 0 },
          'circle-color-transition': { duration: 600, delay: 0 },
        },
      });
      map.addLayer({
        id: 'unclustered-label',
        type: 'symbol',
        source: 'locations-source',
        filter: ['!', ['has', 'point_count']],
        layout: {
          'text-field': ['get', 'overallAQI'],
          'text-size': 10,
          'text-offset': [0, 0],
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 1,
        },
      });

      map.on('mouseenter', 'unclustered-point', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        const feat = e.features?.[0];
        console.log('feat', feat);
        if (!feat) return;
        const html = feat.properties?.popupHTML || '';
        popupRef.current?.setLngLat(e.lngLat).setHTML(html).addTo(map);
        console.log('html', html);
        console.log(
          'popupref',
          popupRef.current?.setLngLat(e.lngLat).setHTML(html).addTo(map)
        );
      });
      map.on('mouseleave', 'unclustered-point', () => {
        map.getCanvas().style.cursor = '';
        popupRef.current?.remove();
      });

      map.on('mouseenter', 'clusters', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        const clusterFeature = e.features?.[0];
        if (!clusterFeature) return;

        const clusterId = clusterFeature.id;
        const source = map.getSource('locations-source') as GeoJSONSource;
        source.getClusterLeaves(clusterId, 25, 0, (err, leaves) => {
          if (err) {
            console.error('getClusterLeaves error:', err);
            return;
          }
          let html = `
            <div style="max-height:200px;overflow:auto;font-size:13px;line-height:1.4;">
              <strong>Clustered Stations (showing up to 25):</strong><br/>
              <table style="border-collapse:collapse;width:100%;">
                <thead>
                  <tr style="border-bottom:1px solid #ccc;">
                    <th style="padding:2px 6px;text-align:left;">Name</th>
                    <th style="padding:2px 6px;text-align:center;">AQI</th>
                  </tr>
                </thead>
                <tbody>
          `;
          leaves.forEach((leaf: any) => {
            const props = leaf.properties || {};
            const stationMatch = props.popupHTML?.match(
              /<strong>(.*?)<\/strong>/
            );
            const stationName = stationMatch ? stationMatch[1] : 'Unknown';
            const aqiVal = props.overallAQI || '?';
            html += `
              <tr style="border-bottom:1px dashed #aaa;">
                <td style="padding:2px 6px;">${stationName}</td>
                <td style="padding:2px 6px;text-align:center;">${aqiVal}</td>
              </tr>
            `;
          });
          html += `</tbody></table></div>`;

          popupRef.current?.setLngLat(e.lngLat).setHTML(html).addTo(map);
        });
      });
      map.on('mouseleave', 'clusters', () => {
        map.getCanvas().style.cursor = '';
        popupRef.current?.remove();
      });
    });

    map.once('idle', () => {
      setMapIsIdle(true);
      onMapIdle?.();
    });

    map.on('moveend', () => {
      if (!mapRef.current || !onMapBoundsChange) return;
      const b = map.getBounds();
      if (!b) return;
      const sw: [number, number] = [b.getSouthWest().lng, b.getSouthWest().lat];
      const ne: [number, number] = [b.getNorthEast().lng, b.getNorthEast().lat];
      onMapBoundsChange(sw, ne);
    });
  }, [chart, onMapIdle, onMapBoundsChange]);

  const createGeoJSON = useCallback((arr: LocalPoint[]) => {
    return {
      type: 'FeatureCollection',
      features: arr.map((p) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [p.lon, p.lat],
        },
        properties: {
          overallColor: aqiColor(p.aqi),
          overallAQI: p.aqi < 0 ? '?' : String(p.aqi),
          popupHTML: p.popupHTML,
        },
      })),
    } as GeoJSON.FeatureCollection<GeoJSON.Geometry>;
  }, []);

  useEffect(() => {
    if (!mapIsIdle || chart !== '2' || !points.length || !mapRef.current)
      return;
    const geo = createGeoJSON(points);
    const src = mapRef.current.getSource('locations-source') as GeoJSONSource;
    if (src) {
      src.setData(geo);
      mapRef.current.resize();
    }
  }, [mapIsIdle, chart, points, createGeoJSON]);

  const [scatterData, setScatterData] = useState<any[]>([]);
  const [scatterLayout, setScatterLayout] = useState<any>({});
  useEffect(() => {
    if (chart !== '1') {
      setScatterData([]);
      setScatterLayout({});
      return;
    }
    if (!points.length) {
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
      line: {
        color: aqiColor(b.value),
        width: 2,
        dash: 'dash',
      },
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
    const { data: groupedData, maxVal } = calculateAverageChart(points);
    if (!groupedData.length) {
      setMiniChartData([]);
      setMiniChartLayout({});
      return;
    }
    let upper = maxVal * 1.2;
    if (upper < 50) upper = 50;
    if (upper > 500) upper = 500;
    const miniLayout = {
      width: 280,
      height: 240,
      title: 'Average AQI',
      margin: { l: 30, r: 20, t: 40, b: 30 },
    };
    setMiniChartData(groupedData);
    setMiniChartLayout(miniLayout);
  }, [chart, points]);

  const displayedPoints = useMemo(() => {
    let filtered = points;
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(q));
    }
    if (sortMode === 'aqi') {
      filtered.sort((a, b) =>
        sortDirection === 'asc' ? a.aqi - b.aqi : b.aqi - a.aqi
      );
    } else {
      filtered.sort((a, b) =>
        sortDirection === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name)
      );
    }
    return filtered;
  }, [points, searchQuery, sortMode, sortDirection]);

  const toggleSidebar = () => {
    setShowSidebar((prev) => {
      if (chart === '2' && mapRef.current) {
        setTimeout(() => {
          mapRef.current?.resize();
        }, 300);
      }
      return !prev;
    });
  };

  const toggleMiniChart = () => {
    setMiniChartExpanded((prev) => !prev);
  };

  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
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
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            p: 1,
            pt: 2,
            justifyContent: 'center',
          }}
        >
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
              variant="outlined"
              size="small"
              sx={{ flex: 1 }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <FormControl size="small" variant="outlined" sx={{ minWidth: 90 }}>
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
                setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
              }
            >
              {sortDirection === 'asc' ? '▲' : '▼'}
            </IconButton>
            <IconButton size="medium" onClick={toggleSidebar}>
              <CloseCircleOutlined />
            </IconButton>
          </Box>

          <Box sx={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
            <TransitionGroup component={null}>
              {displayedPoints.map((p) => {
                const rowColor = aqiColor(p.aqi) + '33';
                return (
                  <CSSTransition
                    key={`${p.name}-${p.lat}-${p.lon}`}
                    timeout={300}
                    classNames="fade"
                  >
                    <ListItem
                      sx={{
                        backgroundColor: rowColor,
                        borderRadius: 2,
                        mb: 1,
                        cursor: 'pointer',
                        transition: 'background-color 0.3s',
                        '&:hover': { backgroundColor: 'rgba(0,0,0,0.1)' },
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
                            <Typography variant="caption" sx={{ mt: 1 }}>
                              Last Update: {p.timestamp}
                            </Typography>
                          )
                        }
                      />
                    </ListItem>
                  </CSSTransition>
                );
              })}
            </TransitionGroup>
          </Box>
        </Box>
      </Drawer>
      {showSidebar && chart === '2' && <Box sx={{ width: 300 }} />}

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
            {scatterData.length > 0 ? (
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
                onClick={toggleSidebar}
                sx={{
                  position: 'fixed',
                  top: 40,
                  left: 40,
                  zIndex: 1300,
                  backgroundColor: 'rgba(255,255,255,0.8)',
                  border: '1px solid #ccc',
                  borderRadius: 2,
                  '&:hover': { backgroundColor: 'rgba(255,255,255,1)' },
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
              toggleMiniChart={toggleMiniChart}
            />
          </>
        )}
      </Box>
    </Box>
  );
};

export default ChartOrMap;
