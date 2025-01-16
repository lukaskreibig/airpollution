/**
 * @file Chart.tsx
 * @desc Main Chart component that coordinates the map, plotly charts, sidebar, mini chart, and legend.
 */
import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import {
  Box,
  IconButton,
  Typography,
  Drawer,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ListItem,
  ListItemText,
  List,
} from '@mui/material';
import { MenuOutlined, CloseCircleOutlined } from '@ant-design/icons';
import Plot from 'react-plotly.js';
import mapboxgl, { GeoJSONSource } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import Logo from './Logo';
import {
  calculateBigChart,
  calculateBigLayout,
  calculateAverageChart,
  computeAqiForPollutant,
  computeOverallAqi,
  ProcessedLocation,
} from './ChartFunction';
import {
  aqiColor,
  isValidMeasurement,
  formatDate,
  truncateAndConvert,
  useWindowDimensions,
  ALLOWED_PARAMS,
  INITIAL_CENTER,
  INITIAL_ZOOM,
} from './chartUtilsHelpers/chartUtilsHelpers';

import { LatestResult, Country } from '../../../react-app-env';
import { PlotData } from 'plotly.js';
import Legend from './Legend/Legend';
import MiniChart from './MiniChart/MiniChart';

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || '';

/**
 * @interface ChartProps
 * @property {string} chart - The chart type ("1" or "2").
 * @property {LatestResult[]} locations - Array of measurement data.
 * @property {string} country - Selected country ID.
 * @property {Country[]} countriesList - Array of countries.
 * @property {boolean} showSidebar - Whether the sidebar (drawer) is open.
 * @property {React.Dispatch<React.SetStateAction<boolean>>} setShowSidebar - Function to toggle sidebar open/close.
 * @property {() => void} [onMapLoadEnd] - Optional callback after the map finishes loading.
 */
interface ChartProps {
  chart: string;
  locations: LatestResult[];
  country: string;
  countriesList: Country[];
  showSidebar: boolean;
  setShowSidebar: React.Dispatch<React.SetStateAction<boolean>>;
  onMapLoadEnd?: () => void;
}

/**
 * @function Chart
 * @desc Main chart component for displaying scatter or map-based air quality data, along with a sidebar and mini chart.
 */
const Chart: React.FC<ChartProps> = ({
  chart,
  locations,
  country,
  countriesList,
  showSidebar,
  setShowSidebar,
  onMapLoadEnd,
}) => {
  // -- Window dims
  const { width, height } = useWindowDimensions();

  // -- Plotly chart states
  const [plotData, setPlotData] = useState<Partial<PlotData>[]>([]);
  const [plotLayout, setPlotLayout] = useState<Partial<Plotly.Layout>>({});
  const [revision, setRevision] = useState<number>(0);

  // -- Mini chart states
  const [miniChartData, setMiniChartData] = useState<Partial<PlotData>[]>([]);
  const [miniChartLayout, setMiniChartLayout] = useState<
    Partial<Plotly.Layout>
  >({});
  const [miniChartExpanded, setMiniChartExpanded] = useState<boolean>(true);

  // -- Map references
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  // -- Sidebar search/sort states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortMode, setSortMode] = useState<
    'name' | 'aqi' | 'pm25' | 'pm10' | 'so2' | 'no2' | 'co'
  >('aqi');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // -- Processed locations
  const [processedLocs, setProcessedLocs] = useState<ProcessedLocation[]>([]);

  // -- Active country name
  const activeCountryName = useMemo(() => {
    const found = countriesList.find((c) => String(c.id) === country);
    return found ? found.name : 'Unknown Country';
  }, [country, countriesList]);

  /**
   * @function formatParamNameHTML
   * @desc Formats a pollutant parameter to an HTML string with sub/superscripts.
   * @param {string} param - The pollutant parameter name
   * @returns {string} - Formatted HTML string for use in popups
   */
  const formatParamNameHTML = useCallback((param: string): string => {
    const mapping: Record<string, string> = {
      o3: 'O<sub>3</sub>',
      pm25: 'PM<sub>2.5</sub>',
      pm10: 'PM<sub>10</sub>',
      so2: 'SO<sub>2</sub>',
      no2: 'NO<sub>2</sub>',
      co: 'CO',
    };
    return mapping[param.toLowerCase()] || param.toUpperCase();
  }, []);

  /**
   * @function processLocations
   * @desc Converts raw LatestResult locations into a filtered array of ProcessedLocation, excluding invalid data.
   * @param {LatestResult[]} locs - Raw measurement data
   * @returns {ProcessedLocation[]} - Array of processed locations
   */
  const processLocations = useCallback(
    (locs: LatestResult[]): ProcessedLocation[] => {
      const results = locs.map((loc) => {
        if (!loc.coordinates) return null;
        if (!loc.measurements || loc.measurements.length === 0) return null;

        const paramObj: Record<string, number> = {};
        let timestamp = '';

        loc.measurements.forEach((m) => {
          const p = m.parameter?.toLowerCase() || '';
          if (!isValidMeasurement(p, m.value)) return;
          const conv = truncateAndConvert(p, m.value);
          if (!timestamp && m.lastUpdated) {
            timestamp = formatDate(m.lastUpdated);
          }
          paramObj[p] = conv;
        });

        if (Object.keys(paramObj).length === 0) return null;

        const overallAQI = computeOverallAqi(paramObj);
        if (overallAQI <= 0) return null;
        if (Object.keys(paramObj).length < 2) return null;

        let html = `<div style="font-size:14px;line-height:1.4;">`;
        html += `<strong>${loc.location}</strong><br/>`;
        if (loc.city) html += `City: ${loc.city}<br/>`;
        html += `Overall AQI: <span style="color:${aqiColor(
          overallAQI
        )};font-weight:bold;">${overallAQI < 0 ? '?' : overallAQI}</span><br/>`;

        for (const [p, val] of Object.entries(paramObj)) {
          const subAqi = computeAqiForPollutant(p, val);
          const color = aqiColor(subAqi);
          html += `<span style="color:${color};font-weight:bold;">${formatParamNameHTML(
            p
          )}: ${val.toFixed(2)} (AQI ${subAqi < 0 ? '?' : subAqi})</span><br/>`;
        }
        if (timestamp) {
          html += `<span style="font-size:11px; color:gray;">Last Update: <span style="font-weight:bold;">${timestamp}</span></span><br/>`;
        }
        html += `</div>`;

        return {
          name: typeof loc.location === 'string' ? loc.location : 'Unknown',
          city: typeof loc.city === 'string' ? loc.city : 'Unknown',
          lat: loc.coordinates.latitude,
          lon: loc.coordinates.longitude,
          parameters: paramObj,
          timestamp,
          popupHTML: html,
        };
      });
      return results.filter((r) => r !== null) as ProcessedLocation[];
    },
    [formatParamNameHTML]
  );

  /**
   * @function createGeoJSON
   * @desc Builds a GeoJSON FeatureCollection from an array of ProcessedLocation objects.
   * @param {ProcessedLocation[]} plocs - Processed location data
   * @returns {GeoJSON.FeatureCollection<GeoJSON.Point>} - The resulting GeoJSON data
   */
  const createGeoJSON = useCallback(
    (plocs: ProcessedLocation[]): GeoJSON.FeatureCollection<GeoJSON.Point> => {
      const features = plocs.map<GeoJSON.Feature<GeoJSON.Point>>((ploc) => {
        const overallVal = computeOverallAqi(ploc.parameters);
        const color = aqiColor(overallVal);
        const label = overallVal < 0 ? '?' : String(overallVal);

        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [ploc.lon, ploc.lat],
          },
          properties: {
            popupHTML: ploc.popupHTML,
            overallAQI: label,
            overallColor: color,
          },
        };
      });
      return { type: 'FeatureCollection', features };
    },
    []
  );

  /**
   * @function centerMapOnCountry
   * @desc Centers the map on the currently selected country if coordinates are present.
   */
  const centerMapOnCountry = useCallback(() => {
    const foundCountry = countriesList.find((c) => String(c.id) === country);
    if (foundCountry && foundCountry.coordinates && mapRef.current) {
      const { lat, lon } = foundCountry.coordinates;
      mapRef.current.flyTo({
        center: [lon, lat],
        zoom: 5,
        essential: true,
        duration: 1000,
      });
    }
  }, [countriesList, country]);

  /**
   * Convert raw locations => processedLocs any time locations changes.
   */
  useEffect(() => {
    const plocs = processLocations(locations);
    setProcessedLocs(plocs);
  }, [locations, processLocations]);

  /**
   * @function adjustMapView
   * @desc Fits or centers the map around the processed location boundaries.
   */
  const adjustMapView = useCallback(
    (map: mapboxgl.Map, plocs: ProcessedLocation[]) => {
      if (plocs.length === 0) {
        map.flyTo({
          center: INITIAL_CENTER,
          zoom: INITIAL_ZOOM,
          duration: 300,
        });
        return;
      }
      if (plocs.length === 1) {
        map.flyTo({
          center: [plocs[0].lon, plocs[0].lat],
          zoom: 10,
          duration: 300,
        });
        return;
      }
      let minLat = Infinity,
        maxLat = -Infinity,
        minLon = Infinity,
        maxLon = -Infinity;
      for (const p of plocs) {
        if (p.lat < minLat) minLat = p.lat;
        if (p.lat > maxLat) maxLat = p.lat;
        if (p.lon < minLon) minLon = p.lon;
        if (p.lon > maxLon) maxLon = p.lon;
      }
      if (
        isFinite(minLat) &&
        isFinite(minLon) &&
        isFinite(maxLat) &&
        isFinite(maxLon)
      ) {
        map.fitBounds(
          [
            [minLon, minLat],
            [maxLon, maxLat],
          ],
          { padding: 50, duration: 300 }
        );
      } else {
        map.flyTo({
          center: INITIAL_CENTER,
          zoom: INITIAL_ZOOM,
          duration: 300,
        });
      }
    },
    []
  );

  /**
   * @function mapRefInit
   * @desc Initializes the Mapbox map when chart=2.
   */
  const mapRefInit = useCallback(() => {
    if (!mapContainerRef.current) return;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v10',
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
    });
    mapRef.current = map;
    popupRef.current = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
    });

    map.on('load', () => {
      map.dragPan.enable();
      map.addSource('locations-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'locations-layer',
        type: 'circle',
        source: 'locations-source',
        paint: {
          'circle-radius': 10,
          'circle-color': ['get', 'overallColor'],
        },
      });
      map.addLayer({
        id: 'locations-label',
        type: 'symbol',
        source: 'locations-source',
        layout: {
          'text-field': ['get', 'overallAQI'],
          'text-size': 10,
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 1,
        },
      });

      const popupObj = popupRef.current!;
      map.on('mouseenter', 'locations-layer', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        if (!e.features || !e.features[0]) return;
        const html = e.features[0].properties?.popupHTML || '';
        popupObj.setLngLat(e.lngLat).setHTML(html).addTo(map);
      });
      map.on('mouseleave', 'locations-layer', () => {
        map.getCanvas().style.cursor = '';
        popupObj.remove();
      });

      map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.addControl(
        new mapboxgl.ScaleControl({ maxWidth: 100, unit: 'metric' }),
        'bottom-left'
      );

      const plocs = processLocations(locations);
      setProcessedLocs(plocs);

      const geojson = createGeoJSON(plocs);
      const src = map.getSource('locations-source') as GeoJSONSource;
      src.setData(geojson);

      adjustMapView(map, plocs);
      if (onMapLoadEnd) onMapLoadEnd();
    });
  }, [locations, processLocations, createGeoJSON, adjustMapView, onMapLoadEnd]);

  /**
   * If chart=2 => init map; else remove map
   */
  useEffect(() => {
    if (chart !== '2') {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      return;
    }
    if (!mapRef.current && mapContainerRef.current) {
      mapRefInit();
    }
  }, [chart, mapRefInit]);

  /**
   * Refresh map if chart=2 changes or when data updates
   */
  useEffect(() => {
    if (chart === '2' && mapRef.current && mapRef.current.isStyleLoaded()) {
      mapRef.current.resize();
      const plocs = processLocations(locations);
      setProcessedLocs(plocs);

      const geojson = createGeoJSON(plocs);
      const src = mapRef.current.getSource('locations-source') as GeoJSONSource;
      src.setData(geojson);

      adjustMapView(mapRef.current, plocs);
      if (onMapLoadEnd) onMapLoadEnd();
    }
  }, [
    chart,
    locations,
    processLocations,
    createGeoJSON,
    adjustMapView,
    onMapLoadEnd,
  ]);

  /**
   * Build the big Plotly chart if chart=1
   */
  useEffect(() => {
    if (!locations.length) {
      setPlotData([]);
      setPlotLayout({});
      return;
    }
    if (chart === '1') {
      const scatterData = calculateBigChart(chart, locations);
      if (!scatterData.length) {
        setPlotData([]);
        setPlotLayout({});
      } else {
        const scatterLayout = calculateBigLayout(
          chart,
          locations,
          width,
          height
        );
        setPlotData(scatterData);
        setPlotLayout(scatterLayout);
      }
      setRevision((r) => r + 1);
    } else {
      setPlotData([]);
      setPlotLayout({});
    }
  }, [chart, locations, width, height, processedLocs]);

  /**
   * Build the mini average chart if chart=2
   */
  useEffect(() => {
    if (chart !== '2' || !processedLocs.length) {
      setMiniChartData([]);
      setMiniChartLayout({});
      return;
    }
    const { data: groupedData, maxVal } = calculateAverageChart(processedLocs);
    if (!groupedData.length) {
      setMiniChartData([]);
      setMiniChartLayout({});
      return;
    }
    let upper = maxVal * 1.2;
    if (upper < 50) upper = 50;
    if (upper > 500) upper = 500;

    const miniLayout: Partial<Plotly.Layout> = {
      width: 280,
      height: 240,
      title: `Avg AQI in ${activeCountryName}`,
      margin: { l: 30, r: 20, t: 30, b: 35 },
      xaxis: { tickangle: -30 },
      yaxis: { range: [0, upper], title: '' },
      font: { size: window.innerWidth < 600 ? 10 : 12 },
    };
    setMiniChartData(groupedData);
    setMiniChartLayout(miniLayout);
  }, [chart, processedLocs, activeCountryName]);

  /**
   * @function handleCityMouseEnter
   * @desc Flies map to a city location on mouse enter (optional).
   */
  const handleCityMouseEnter = (ploc: ProcessedLocation) => {
    if (chart === '2' && mapRef.current && popupRef.current) {
      mapRef.current.flyTo({
        center: [ploc.lon, ploc.lat],
        zoom: 10,
        duration: 300,
      });
    }
  };
  const handleCityMouseLeave = () => {};
  const handleCityClick = (ploc: ProcessedLocation) => {
    if (chart === '2' && mapRef.current) {
      mapRef.current.flyTo({
        center: [ploc.lon, ploc.lat],
        zoom: 10,
        duration: 300,
      });
    }
  };

  /**
   * @function toggleSidebar
   * @desc Opens or closes the sidebar drawer.
   */
  const toggleSidebar = () => {
    setShowSidebar((prev) => {
      const newVal = !prev;
      if (chart === '2' && mapRef.current) {
        setTimeout(() => {
          mapRef.current?.resize();
          if (newVal) {
            centerMapOnCountry();
          } else {
            adjustMapView(mapRef.current!, processedLocs);
          }
        }, 300);
      }
      return newVal;
    });
  };

  /**
   * @function toggleMiniChart
   * @desc Expands or collapses the mini average chart overlay.
   */
  const toggleMiniChart = () => setMiniChartExpanded((prev) => !prev);

  /**
   * @constant displayedLocs
   * @desc Filtered and sorted array of processedLocs for the sidebar.
   */
  const displayedLocs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = processedLocs.filter((ploc) => {
      if (!q) return true;
      const nameMatch = ploc.name.toLowerCase().includes(q);
      const cityMatch = ploc.city?.toLowerCase().includes(q) ?? false;
      return nameMatch || cityMatch;
    });
    const sorted = [...filtered].sort((a, b) => {
      const getValue = (
        loc: ProcessedLocation,
        param: keyof typeof loc.parameters
      ): number => loc.parameters[param] ?? -Infinity;

      if (sortMode === 'aqi') {
        const aVal = computeOverallAqi(a.parameters);
        const bVal = computeOverallAqi(b.parameters);
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      } else if (ALLOWED_PARAMS.has(sortMode)) {
        const aVal = getValue(a, sortMode as keyof typeof a.parameters);
        const bVal = getValue(b, sortMode as keyof typeof b.parameters);
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const cmp = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [processedLocs, searchQuery, sortMode, sortDirection]);

  return (
    <Box display="flex">
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
            alignSelf: 'center',
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
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              gap: 1,
              alignItems: 'center',
            }}
          >
            <Box sx={{ flex: 1 }}>
              <TextField
                label="Search"
                variant="outlined"
                size="small"
                fullWidth
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-field"
              />
            </Box>
            <FormControl
              size="small"
              variant="outlined"
              className="choose-sort"
              sx={{ minWidth: 100 }}
            >
              <InputLabel>Sort</InputLabel>
              <Select
                label="Sort"
                value={sortMode}
                onChange={(e) =>
                  setSortMode(
                    e.target.value as
                      | 'name'
                      | 'aqi'
                      | 'pm25'
                      | 'pm10'
                      | 'so2'
                      | 'no2'
                      | 'co'
                  )
                }
              >
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="aqi">AQI</MenuItem>
                <MenuItem value="pm25">
                  PM<sub>2.5</sub>
                </MenuItem>
                <MenuItem value="pm10">
                  PM<sub>10</sub>
                </MenuItem>
                <MenuItem value="so2">
                  SO<sub>2</sub>
                </MenuItem>
                <MenuItem value="no2">
                  NO<sub>2</sub>
                </MenuItem>
                <MenuItem value="co">CO</MenuItem>
              </Select>
            </FormControl>
            <IconButton
              size="small"
              edge="start"
              onClick={() =>
                setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
              }
              className="sort-select"
            >
              {sortDirection === 'asc' ? '▲' : '▼'}
            </IconButton>
            <IconButton
              size="medium"
              onClick={toggleSidebar}
              className="close-list"
            >
              <CloseCircleOutlined />
            </IconButton>
          </Box>

          <List dense sx={{ flex: 1, overflowY: 'auto' }}>
            {displayedLocs.map((ploc) => {
              const overallVal = computeOverallAqi(ploc.parameters);
              const bkgColor = aqiColor(overallVal) + '33';

              const paramLines: JSX.Element[] = [];
              for (const [p, v] of Object.entries(ploc.parameters)) {
                const subAqi = computeAqiForPollutant(p, v);
                if (subAqi < 0) continue;
                const color = aqiColor(subAqi);
                paramLines.push(
                  <React.Fragment key={p}>
                    <Box component="span" sx={{ color, fontWeight: 'bold' }}>
                      {p.toLowerCase() === 'pm25' ||
                      p.toLowerCase() === 'pm10' ? (
                        <>
                          {p.toLowerCase() === 'pm25' ? 'PM₂.₅' : 'PM₁₀'}:{' '}
                          {v.toFixed(2)} (AQI {subAqi})
                        </>
                      ) : (
                        <>
                          {p.toUpperCase()}: {v.toFixed(2)} (AQI {subAqi})
                        </>
                      )}
                    </Box>
                    <br />
                  </React.Fragment>
                );
              }

              return (
                <ListItem
                  key={`${ploc.name}-${ploc.lat}-${ploc.lon}-${Math.random()}`}
                  component="li"
                  onMouseEnter={() => handleCityMouseEnter(ploc)}
                  onMouseLeave={handleCityMouseLeave}
                  onClick={() => handleCityClick(ploc)}
                  sx={{
                    backgroundColor: bkgColor,
                    borderRadius: 2,
                    mb: 1,
                    cursor: 'pointer',
                    transition: 'background-color 0.3s',
                    '&:hover': {
                      backgroundColor: 'rgba(0,0,0,0.1)',
                    },
                  }}
                  role="button"
                >
                  <ListItemText
                    primary={
                      <Box sx={{ fontWeight: 'bold' }}>
                        {ploc.name}
                        {ploc.city ? `, ${ploc.city}` : ''}
                        <span style={{ float: 'right', fontSize: '0.9rem' }}>
                          {overallVal < 0 ? '?' : overallVal}
                        </span>
                      </Box>
                    }
                    secondary={
                      <>
                        {paramLines}
                        {ploc.timestamp && (
                          <Typography
                            variant="caption"
                            display="block"
                            sx={{ mt: 1 }}
                          >
                            Last Sensor Update: {ploc.timestamp}
                          </Typography>
                        )}
                      </>
                    }
                  />
                </ListItem>
              );
            })}
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
              backgroundColor: 'rgba(255,255,255,0.8)',
              '&:hover': { backgroundColor: 'rgba(255,255,255,1)' },
            }}
            className="sidebar-toggle-button"
          >
            <MenuOutlined />
          </IconButton>
        )}

        <Box sx={{ flex: 1, height: '100%' }}>
          {chart === '2' ? (
            <>
              {/* The map */}
              <div
                ref={mapContainerRef}
                className="map-area"
                style={{ width: '100%', height: '100%' }}
              />

              {/* Legend */}
              <Legend showSidebar={showSidebar} chart={chart} />

              {/* Mini Chart */}
              <MiniChart
                miniChartData={miniChartData}
                miniChartLayout={miniChartLayout}
                miniChartExpanded={miniChartExpanded}
                toggleMiniChart={toggleMiniChart}
              />
            </>
          ) : plotData && plotData.length > 0 ? (
            <Box className="chart-area" sx={{ width: '100%', height: '100%' }}>
              <Plot
                data={plotData}
                layout={plotLayout}
                revision={revision}
                style={{ width: '100%', height: '100%' }}
                useResizeHandler
                config={{
                  displayModeBar: true,
                  responsive: true,
                }}
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
                No data available to display.
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Chart;
