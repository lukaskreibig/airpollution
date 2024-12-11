import { useEffect, useState, useRef, useCallback } from "react";
import Plot from "react-plotly.js";
import { LatestResult, Country } from "../../../react-app-env";
import { Layout, PlotData } from "plotly.js";
import ChartFunction from "./ChartFunction";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import { 
  Box, 
  List, 
  ListItem, 
  ListItemText, 
  TextField, 
  Select, 
  MenuItem, 
  InputLabel, 
  FormControl, 
  IconButton, 
  Drawer, 
  Typography 
} from '@mui/material';
import { CloseCircleOutlined, MenuOutlined } from "@ant-design/icons";

interface ProcessedLocation {
  name: string;
  city?: string;
  pm25?: number;
  pm10?: number;
  lat: number;
  lon: number;
  text: string;
}

type Props = {
  chart: string;
  locations: LatestResult[];
  country: string;
  countriesList: Country[];
  showSidebar: boolean;
  setShowSidebar: React.Dispatch<React.SetStateAction<boolean>>;
};

const drawerWidth = 300; // Feste Breite für die Sidebar

const INITIAL_CENTER: [number, number] = [-74.0242, 40.6941];
const INITIAL_ZOOM = 10.12;

// WHO-Richtlinien
const WHO_PM25_GUIDELINE = 15;
const WHO_PM10_GUIDELINE = 45;

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || '';

const Chart: React.FC<Props> = ({ chart, locations, country, showSidebar, setShowSidebar }) => {
  const [data, setData] = useState<Partial<PlotData>[]>([]);
  const [layout, setLayout] = useState<Partial<Layout>>({});
  const [revision, setRevision] = useState<number>(0);

  const {
    calculateBigChart,
    calculateBigLayout,
    calculateAverageChart,
    calculateAverageLayout
  } = ChartFunction();

  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  const popupRef = useRef<mapboxgl.Popup | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<'name'|'pm25'|'pm10'|'none'>('none');
  const [processedLocs, setProcessedLocs] = useState<ProcessedLocation[]>([]);

  // useEffect zum Zurücksetzen der Suchabfrage bei Länderwechsel
  useEffect(() => {
    setSearchQuery('');
  }, [country]);

  // Funktion zum Erstellen des Hover-Textes
  const buildHoverText = useCallback((loc: LatestResult): string | null => {
    const pm25 = loc.measurements.find(m => m.parameter === 'pm25')?.value;
    const pm10 = loc.measurements.find(m => m.parameter === 'pm10')?.value;
    const temp = loc.measurements.find(m => m.parameter === 'temperature')?.value;
    const hum = loc.measurements.find(m => m.parameter === 'relativehumidity')?.value;

    if (pm25 === undefined && pm10 === undefined && temp === undefined && hum === undefined) {
      return null;
    }

    let text = `<div style="font-family:sans-serif;font-size:14px;line-height:1.4;">`;
    const locName = typeof loc.location === 'string' ? loc.location : 'Unknown';
    text += `<strong>${locName}</strong><br/>`;
    if (loc.city) text += `City: ${loc.city}<br/>`;
    if (pm25 !== undefined) text += `PM2.5: ${pm25.toFixed(2)} µg/m³<br/>`;
    if (pm10 !== undefined) text += `PM10: ${pm10.toFixed(2)} µg/m³<br/>`;
    if (temp !== undefined) text += `Temperature: ${temp.toFixed(2)} °C<br/>`;
    if (hum !== undefined) text += `Humidity: ${hum.toFixed(2)}%<br/>`;
    text += `</div>`;

    return text;
  }, []);

  // Funktion zum Verarbeiten der Standorte
  const processLocations = useCallback((locs: LatestResult[]): ProcessedLocation[] => {
    return locs
      .map((loc) => {
        if (!loc.coordinates) return null;

        const pm25 = loc.measurements.find(m => m.parameter === 'pm25')?.value;
        const pm10 = loc.measurements.find(m => m.parameter === 'pm10')?.value;
        const temp = loc.measurements.find(m => m.parameter === 'temperature')?.value;
        const hum = loc.measurements.find(m => m.parameter === 'relativehumidity')?.value;

        if (pm25 === undefined && pm10 === undefined && temp === undefined && hum === undefined) {
          return null;
        }

        const text = buildHoverText(loc);
        if (!text) return null;

        const locName = typeof loc.location === 'string' ? loc.location : 'Unknown';
        const ploc: ProcessedLocation = {
          name: locName,
          lat: loc.coordinates.latitude,
          lon: loc.coordinates.longitude,
          text
        };
        if (loc.city && typeof loc.city === 'string') ploc.city = loc.city;
        if (pm25 !== undefined) ploc.pm25 = pm25;
        if (pm10 !== undefined) ploc.pm10 = pm10;

        return ploc;
      })
      .filter((f): f is ProcessedLocation => f !== null);
  }, [buildHoverText]);

  // Funktion zum Erstellen von GeoJSON
  const createGeoJSON = useCallback((plocs: ProcessedLocation[]): GeoJSON.FeatureCollection<GeoJSON.Point> => {
    const features = plocs.map(ploc => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [ploc.lon, ploc.lat]
      },
      properties: {
        text: ploc.text,
        pm25: ploc.pm25 ?? 0,
        pm10: ploc.pm10 ?? 0
      }
    }));
    return { type: 'FeatureCollection', features };
  }, []);

  // Gefilterte und sortierte Liste der Standorte
  const displayedLocs = processedLocs
    .filter(ploc => {
      const q = searchQuery.trim().toLowerCase();
      if (q === '') return true; // Zeige alle, wenn die Suche leer ist
      const nameMatch = ploc.name.toLowerCase().includes(q);
      const cityMatch = ploc.city?.toLowerCase().includes(q) ?? false;
      return nameMatch || cityMatch;
    })
    .sort((a, b) => {
      if (sortMode === 'pm25') return ((b.pm25 ?? 0) - (a.pm25 ?? 0));
      if (sortMode === 'pm10') return ((b.pm10 ?? 0) - (a.pm10 ?? 0));
      if (sortMode === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

  // Funktion zur Anpassung der Kartenansicht
  const adjustMapView = useCallback((map: mapboxgl.Map, plocs: ProcessedLocation[]) => {
    if (plocs.length === 0) {
      map.flyTo({ center: INITIAL_CENTER, zoom: INITIAL_ZOOM, duration: 300 });
      return;
    }

    if (plocs.length === 1) {
      map.flyTo({ center: [plocs[0].lon, plocs[0].lat], zoom: 10, duration: 300 });
    } else {
      let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;
      for (const p of plocs) {
        if (p.lat < minLat) minLat = p.lat;
        if (p.lat > maxLat) maxLat = p.lat;
        if (p.lon < minLon) minLon = p.lon;
        if (p.lon > maxLon) maxLon = p.lon;
      }

      if (isFinite(minLat) && isFinite(minLon) && isFinite(maxLat) && isFinite(maxLon)) {
        map.fitBounds([[minLon, minLat], [maxLon, maxLat]], { padding: 50, duration: 300 });
      } else {
        map.flyTo({ center: INITIAL_CENTER, zoom: INITIAL_ZOOM, duration: 300 });
      }
    }
  }, []);

  // Lebenszyklus der Karte verwalten
  useEffect(() => {
    if (chart !== "3") {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      return;
    }

    if (!mapRef.current && mapContainerRef.current) {
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/light-v10',
        center: INITIAL_CENTER,
        zoom: INITIAL_ZOOM
      });
      mapRef.current = map;
      popupRef.current = new mapboxgl.Popup({ closeButton: false, closeOnClick: false });

      map.on('load', () => {
        map.dragPan.enable();

        if (!map.getSource('locations-source')) {
          map.addSource('locations-source', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] }
          });

          map.addLayer({
            id: 'locations-layer',
            type: 'circle',
            source: 'locations-source',
            paint: {
              'circle-radius': 6,
              'circle-color': [
                'case',
                ['>', ['get', 'pm25'], WHO_PM25_GUIDELINE], '#d62828',
                ['>', ['get', 'pm10'], WHO_PM10_GUIDELINE], '#d62828',
                '#2a9d8f'
              ]
            }
          });

          const popup = popupRef.current!;
          map.on('mouseenter', 'locations-layer', (e) => {
            map.getCanvas().style.cursor = 'pointer';
            if (!e.features || !e.features[0]) return;
            const text = e.features[0].properties?.text || '';
            popup.setLngLat(e.lngLat).setHTML(text).addTo(map);
          });

          map.on('mouseleave', 'locations-layer', () => {
            map.getCanvas().style.cursor = '';
            popup.remove();
          });

          map.addControl(new mapboxgl.NavigationControl(), 'top-right');
          map.addControl(new mapboxgl.ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-left');

          const plocs = processLocations(locations);
          setProcessedLocs(plocs);
          const geojson = createGeoJSON(plocs);
          const src = map.getSource('locations-source') as mapboxgl.GeoJSONSource;
          if (src) src.setData(geojson);

          adjustMapView(map, plocs);
        }
      });
    }
  }, [chart, locations, processLocations, createGeoJSON, adjustMapView]);

  // Aktualisieren der Kartendaten bei Änderungen
  useEffect(() => {
    if (chart === "3" && mapRef.current && mapRef.current.isStyleLoaded()) {
      const map = mapRef.current;
      const plocs = processLocations(locations);
      setProcessedLocs(plocs);

      const geojson = createGeoJSON(plocs);
      const src = map.getSource('locations-source') as mapboxgl.GeoJSONSource;
      if (src) src.setData(geojson);

      adjustMapView(map, plocs);
    }
  }, [chart, locations, country, processLocations, createGeoJSON, adjustMapView]);

  // Szenario für Plotly-Diagramme
  useEffect(() => {
    if (!locations || locations.length === 0) {
      setData([]);
      setLayout({});
      return;
    }

    if (chart === "1") {
      const dataCalc = calculateBigChart(chart, locations);
      const layoutCalc = calculateBigLayout(chart, locations);
      layoutCalc.transition = { duration: 200, easing: "cubic-in-out", ordering: "traces first" };
      setData(dataCalc);
      setLayout(layoutCalc);
      setRevision(prev => prev + 1);
    } else if (chart === "2") {
      const { data: avgData, averages } = calculateAverageChart(locations);
      const layoutCalc = calculateAverageLayout(averages);
      layoutCalc.transition = { duration: 200, easing: "cubic-in-out", ordering: "traces first" };
      setData(avgData);
      setLayout(layoutCalc);
      setRevision(prev => prev + 1);
    }
  }, [chart, locations, calculateBigChart, calculateBigLayout, calculateAverageChart, calculateAverageLayout]);

  const plotConfig: Partial<Plotly.Config> = { responsive: true };

  // Funktionen für das Hoveren und Klicken in der Stadtliste
  const handleCityMouseEnter = (ploc: ProcessedLocation) => {
    if (chart === "3" && mapRef.current && popupRef.current) {
      popupRef.current.setLngLat([ploc.lon, ploc.lat]).setHTML(ploc.text).addTo(mapRef.current);
    }
  };

  const handleCityMouseLeave = () => {
    if (chart === "3" && popupRef.current) {
      popupRef.current.remove();
    }
  };

  const handleCityClick = (ploc: ProcessedLocation) => {
    if (chart === "3" && mapRef.current) {
      mapRef.current.flyTo({ center: [ploc.lon, ploc.lat], zoom: 10, duration: 300 });
    }
  };

  // Funktion zum Ein- und Ausblenden der Sidebar
  const toggleSidebar = () => {
    setShowSidebar((prev: boolean) => !prev);
  };

  return (
    <Box sx={{ display: 'flex', height: '95vh' }}>
      {chart === "3" && (
        <>
          {/* Sidebar Drawer */}
          <Drawer
            variant="persistent"
            anchor="left"
            open={showSidebar}
            sx={{
              width: drawerWidth,
              flexShrink: 0,
              '& .MuiDrawer-paper': { 
                width: drawerWidth, 
                boxSizing: 'border-box',
                borderRight: '1px solid #ccc', // Optional: Rahmen zur besseren Sichtbarkeit
                backgroundColor: '#f5f5f5' // Hintergrundfarbe zur besseren Sichtbarkeit
              },
            }}
          >
            {/* Header der Sidebar */}
            <Box sx={{ display: 'flex', alignItems: 'center', padding: '8px', justifyContent: 'space-between', backgroundColor: '#f5f5f5' }}>
              <Typography variant="h6">Cities</Typography>
              <IconButton onClick={toggleSidebar}>
                <CloseCircleOutlined />
              </IconButton>
            </Box>
            {/* Such- und Sortierfelder */}
            <Box sx={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
              <Box sx={{ display: 'flex', flexDirection: 'row', gap: '10px' }}>
                <TextField 
                  label="Search"
                  variant="outlined"
                  size="small"
                  fullWidth
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                <FormControl size="small" variant="outlined" sx={{ minWidth: 120 }}>
                  <InputLabel>Sort</InputLabel>
                  <Select
                    label="Sort"
                    value={sortMode}
                    onChange={e => setSortMode(e.target.value as 'name' | 'pm25' | 'pm10' | 'none')}
                  >
                    <MenuItem value="none">None</MenuItem>
                    <MenuItem value="name">Name</MenuItem>
                    <MenuItem value="pm25">PM2.5</MenuItem>
                    <MenuItem value="pm10">PM10</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Scrollbare Liste der Städte */}
              <List dense sx={{ flex: 1, overflowY: 'auto' }}>
                {displayedLocs.map(ploc => (
                  <ListItem 
                    key={`${ploc.name}-${ploc.city ?? ''}`} 
                    button
                    onMouseEnter={() => handleCityMouseEnter(ploc)}
                    onMouseLeave={handleCityMouseLeave}
                    onClick={() => handleCityClick(ploc)}
                  >
                    <ListItemText 
                      primary={`${ploc.name}${ploc.city ? `, ${ploc.city}` : ''}`} 
                      secondary={`PM2.5: ${ploc.pm25?.toFixed(2) ?? 'N/A'} µg/m³ | PM10: ${ploc.pm10?.toFixed(2) ?? 'N/A'} µg/m³`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          </Drawer>

          {/* Toggle Button für die Sidebar */}
          {!showSidebar && <IconButton 
            onClick={toggleSidebar}
            sx={{
              position: 'fixed', // Fixiere den Button
              top: 16,
              left: 16, // Positioniere den Button am Anfang
              zIndex: 1300,
              borderRadius: 2,
              borderStyle: "solid",
              borderWidth: 0.5,
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 1)' },
            }}
          >
            <MenuOutlined />
          </IconButton>}
        </>
      )}

      {/* Hauptinhalt: Karte oder Plotly-Diagramm */}
      <Box
        sx={{
          flexGrow: 1,
          transition: 'margin-left 0.3s',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#ffffff' // Hintergrundfarbe für die Karte
        }}
      >
        {chart === "3" ? (
          <>
            {/* Map Container */}
            <div id="map-container" ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

            {/* Legende */}
            <Box
              sx={{
                position: 'absolute',
                bottom: '12px',
                left: '12px',
                background: 'rgba(255,255,255,0.8)',
                padding: '5px 10px',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'sans-serif',
                zIndex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Air Quality</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ display:'inline-block', width:'10px', height:'10px', borderRadius:'50%', marginRight:'5px', background:'#2a9d8f' }}></Box>
                <Typography variant="body2">Within WHO guidelines</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ display:'inline-block', width:'10px', height:'10px', borderRadius:'50%', marginRight:'5px', background:'#d62828' }}></Box>
                <Typography variant="body2">Exceeds WHO guidelines</Typography>
              </Box>
            </Box>
          </>
        ) : (
          (data && data.length > 0 ? (
            <Plot
              data={data}
              layout={layout}
              revision={revision}
              style={{ width: '100%', height: '100%' }}
              useResizeHandler={true}
              config={plotConfig}
            />
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Typography variant="h6">No data available to display the chart.</Typography>
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
};

export default Chart;

const style = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 500,
  bgcolor: "background.paper",
  border: "1px solid #000",
  boxShadow: 24,
  p: 4,
};
