import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import Plot from "react-plotly.js";
import mapboxgl, { GeoJSONSource } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

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
  Typography,
} from "@mui/material";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CloseCircleOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import { LatestResult, Country } from "../../../react-app-env";
import { PlotData } from "plotly.js";

import {
  calculateBigChart,
  calculateBigLayout,
  calculateAverageChart,
  // calculateAverageLayout,
  computeAqiForPollutant,
  computeOverallAqi,
  ProcessedLocation,
} from "./ChartFunction";
import Logo from "./Logo";

/**
 * Funktion zur Bestimmung der AQI-Farbe basierend auf dem Wert.
 */
function aqiColor(aqi: number): string {
  if (aqi < 0) return "#bfbfbf"; // Keine Daten
  if (aqi <= 50) return "#2a9d8f"; // Gut
  if (aqi <= 100) return "#e9c46a"; // Mäßig
  if (aqi <= 150) return "#f4a261"; // Ungesund
  if (aqi <= 200) return "#d62828"; // Sehr Ungesund
  return "#9d0208"; // Gefährlich
}

/**
 * **Inklusionsliste für AQI-Parameter**
 * Enthält nur die für AQI relevanten Schadstoffe.
 */
const ALLOWED_PARAMS = new Set(["o3", "pm25", "pm10", "so2", "no2", "co"]);

/**
 * Überprüft, ob eine Messung basierend auf der Inklusionsliste gültig ist.
 */
function isValidMeasurement(param: string, value: number): boolean {
  if (!ALLOWED_PARAMS.has(param)) return false; // Schließt nicht-AQI-Parameter aus
  if (value <= 0) return false;
  if (value > 600) return false;
  return true;
}

/**
 * Formatiert Datumsstrings für die Anzeige.
 */
function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    };
    return d.toLocaleString("de-DE", options);
  } catch {
    return dateStr;
  }
}

/**
 * Konvertiert Messwerte, falls erforderlich.
 */
function convertIfNeeded(parameter: string, rawValue: number): number {
  if (parameter === "o3") return rawValue / 2000;
  if (parameter === "co") return rawValue / 1145;
  return rawValue;
}

/**
 * Kürzt und konvertiert Messwerte basierend auf dem Parameter.
 */
function truncateAndConvert(parameter: string, val: number): number {
  const cVal = convertIfNeeded(parameter.toLowerCase(), val);
  if (parameter === "pm25") {
    return Number(cVal.toFixed(1));
  } else if (parameter === "pm10") {
    return Math.floor(cVal);
  } else if (parameter === "o3" || parameter === "o3_8h") {
    return Number(cVal.toFixed(3));
  } else if (parameter === "co") {
    return Number(cVal.toFixed(1));
  } else if (parameter === "so2" || parameter === "no2") {
    return Math.floor(cVal);
  }
  return cVal;
}

/**
 * Hook zur Ermittlung der Fensterabmessungen.
 */
function useWindowDimensions() {
  const [dims, setDims] = useState({ width: window.innerWidth, height: window.innerHeight });
  useEffect(() => {
    const handleResize = () => setDims({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return dims;
}

/**
 * Initiale Kartenmitte und Zoom.
 */
const INITIAL_CENTER: [number, number] = [-74.0242, 40.6941];
const INITIAL_ZOOM = 10.12;
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || "";

type Props = {
  chart: string;
  locations: LatestResult[];
  country: string;
  countriesList: Country[];
  showSidebar: boolean;
  setShowSidebar: React.Dispatch<React.SetStateAction<boolean>>;
  onMapLoadEnd?: () => void;
};

/**
 * Chart-Komponente
 * Handhabt die Darstellung von Streu-, Durchschnitts- oder Karten-Charts basierend auf der ausgewählten Typ.
 */
const Chart: React.FC<Props> = ({
  chart,
  locations,
  country,
  countriesList,
  showSidebar,
  setShowSidebar,
  onMapLoadEnd,
}) => {
  const { width, height } = useWindowDimensions();

  // Zustand für Plotly-Daten und -Layout
  const [plotData, setPlotData] = useState<Partial<PlotData>[]>([]);
  const [plotLayout, setPlotLayout] = useState<Partial<Plotly.Layout>>({});
  const [revision, setRevision] = useState<number>(0);

  // Zustand für Mini-Chart
  const [miniChartData, setMiniChartData] = useState<Partial<PlotData>[]>([]);
  const [miniChartLayout, setMiniChartLayout] = useState<Partial<Plotly.Layout>>({});
  const [miniChartExpanded, setMiniChartExpanded] = useState<boolean>(true);

  // Karten-Referenzen
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  // Sidebar-Such- und Sortierzustände
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortMode, setSortMode] = useState<"name" | "aqi" | "pm25" | "pm10" | "so2" | "no2" | "co">("aqi");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Verarbeitete Standorte für Sidebar und Durchschnittschart
  const [processedLocs, setProcessedLocs] = useState<ProcessedLocation[]>([]);

  // Aktiver Ländername
  const activeCountryName = useMemo(() => {
    const found = countriesList.find((c) => String(c.id) === country);
    return found ? found.name : "Unbekanntes Land";
  }, [country, countriesList]);

  /**
   * **Formatierungsfunktion für Parameternamen in der Sidebar**
   * Gibt JSX-Elemente mit richtigen Subscripts zurück.
   * @param param - Der Schadstoffparameter-Code (z.B. 'pm25', 'o3').
   * @returns JSX.Element oder string mit formatiertem Schadstoffnamen.
   */
  const formatParamNameJSX = (param: string): JSX.Element | string => {
    const mapping: Record<string, JSX.Element | string> = {
      o3: <span>O<sub>3</sub></span>,
      pm25: <span>PM<sub>2.5</sub></span>,
      pm10: <span>PM<sub>10</sub></span>,
      so2: <span>SO<sub>2</sub></span>,
      no2: <span>NO<sub>2</sub></span>,
      co: 'CO',
    };
    return mapping[param.toLowerCase()] || param.toUpperCase();
  };

  /**
   * **Formatierungsfunktion für Parameternamen in der Popup-HTML**
   * Gibt Strings mit HTML <sub>-Tags zurück.
   * @param param - Der Schadstoffparameter-Code (z.B. 'pm25', 'o3').
   * @returns String mit formatiertem Schadstoffnamen.
   */
  const formatParamNameHTML = (param: string): string => {
    const mapping: Record<string, string> = {
      o3: 'O<sub>3</sub>',
      pm25: 'PM<sub>2.5</sub>',
      pm10: 'PM<sub>10</sub>',
      so2: 'SO<sub>2</sub>',
      no2: 'NO<sub>2</sub>',
      co: 'CO',
    };
    return mapping[param.toLowerCase()] || param.toUpperCase();
  };

  /**
   * Verarbeitet rohe Standorte zu verarbeiteten Standorten, schließt ungültige Messungen aus.
   */
  const processLocations = useCallback((locs: LatestResult[]): ProcessedLocation[] => {
    const results = locs.map((loc) => {
      if (!loc.coordinates) return null;
      if (!loc.measurements || loc.measurements.length === 0) return null;
  
      const paramObj: Record<string, number> = {};
      let timestamp = "";
  
      loc.measurements.forEach((m) => {
        const p = m.parameter?.toLowerCase() || "";
        if (!isValidMeasurement(p, m.value)) return; // Schließt ungültige aus
  
        const conv = truncateAndConvert(p, m.value);
        if (!timestamp && m.lastUpdated) {
          timestamp = formatDate(m.lastUpdated);
        }
        paramObj[p] = conv;
      });
  
      if (Object.keys(paramObj).length === 0) {
        return null; // Schließt Standort aus, wenn keine gültigen Parameter vorhanden sind
      }
  
      // Berechnung des gesamten AQI
      const overallAQI = computeOverallAqi(paramObj);
  
      // **Neue Bedingung: Ausschluss von AQI <= 0**
      if (overallAQI <= 0) {
        return null; // Schließt Standorte mit AQI 0 oder weniger aus
      }

      if (Object.keys(paramObj).length < 2) {
        return null; // Schließt Standorte mit weniger als zwei Schadstoffen aus
      }
  
      // Erstellung der Popup-HTML
let html = `<div style="font-size:14px;line-height:1.4;">`;
html += `<strong>${loc.location}</strong><br/>`;
if (loc.city) html += `City: ${loc.city}<br/>`;
html += `Overall AQI: <span style="color:${aqiColor(overallAQI)};font-weight:bold;">${overallAQI < 0 ? "?" : overallAQI}</span><br/>`;

for (const [p, val] of Object.entries(paramObj)) {
  const subAqi = computeAqiForPollutant(p, val);
  const color = aqiColor(subAqi);
  html += `<span style="color:${color};font-weight:bold;">${formatParamNameHTML(p)}: ${val.toFixed(2)} (AQI ${subAqi < 0 ? "?" : subAqi})</span><br/>`;
}
// Add "Last Updated" with smaller font size
if (timestamp) {
  html += `<span style="font-size:11px; color:gray;">Last Update: <span style="font-weight:bold;">${timestamp}</span></span><br/>`;
}
html += `</div>`;

  
      return {
        name: typeof loc.location === "string" ? loc.location : "Unknown",
        city: typeof loc.city === "string" ? loc.city : "Unknown",
        lat: loc.coordinates.latitude,
        lon: loc.coordinates.longitude,
        parameters: paramObj,
        timestamp,
        popupHTML: html,
      };
    });
  
    return results.filter(r=>r!==null) as ProcessedLocation[];
  }, []);
  

  /**
   * Erstellt GeoJSON-Daten für Mapbox.
   */
  const createGeoJSON = useCallback(
    (plocs: ProcessedLocation[]): GeoJSON.FeatureCollection<GeoJSON.Point> => {
      const features = plocs.map<GeoJSON.Feature<GeoJSON.Point>>((ploc) => {
        const overallVal = computeOverallAqi(ploc.parameters);
        const color = aqiColor(overallVal);
        const label = overallVal < 0 ? "?" : String(overallVal);

        return {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [ploc.lon, ploc.lat],
          },
          properties: {
            popupHTML: ploc.popupHTML,
            overallAQI: label,
            overallColor: color,
          },
        };
      });

      return { type: "FeatureCollection", features };
    },
    []
  );

  /**
   * Hilfsfunktion zum Zentrieren der Karte auf das ausgewählte Land.
   */
  const centerMapOnCountry = useCallback(() => {
    const foundCountry = countriesList.find((c) => String(c.id) === country);
    if (foundCountry && foundCountry.coordinates && mapRef.current) {
      const { lat, lon } = foundCountry.coordinates;
      mapRef.current.flyTo({
        center: [lon, lat],
        zoom: 5,
        essential: true, // Für barrierefreie Animationen
        duration: 1000,
      });
    }
  }, [countriesList, country]);

  /**
   * Aktualisiert verarbeitete Standorte, wenn sich die Standorte ändern.
   */
  useEffect(() => {
    const plocs = processLocations(locations);
    setProcessedLocs(plocs);
  }, [locations, processLocations]);

  /**
   * Filtert und sortiert Standorte für die Sidebar-Liste.
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
    const getValue = (loc: ProcessedLocation, param: keyof typeof loc.parameters): number => 
      loc.parameters[param] ?? -Infinity;

    if (sortMode === "aqi") {
      const aVal = computeOverallAqi(a.parameters);
      const bVal = computeOverallAqi(b.parameters);
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    } else if (ALLOWED_PARAMS.has(sortMode)) {
      const aVal = getValue(a, sortMode as keyof typeof a.parameters);
      const bVal = getValue(b, sortMode as keyof typeof b.parameters);
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    }
    const comparison = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    return sortDirection === "asc" ? comparison : -comparison;
  });

  return sorted;
}, [processedLocs, searchQuery, sortMode, sortDirection]);

  

  /**
   * Passt die Kartenansicht basierend auf den verarbeiteten Standorten an.
   */
  const adjustMapView = useCallback((map: mapboxgl.Map, plocs: ProcessedLocation[]) => {
    if (plocs.length === 0) {
      map.flyTo({ center: INITIAL_CENTER, zoom: INITIAL_ZOOM, duration: 300 });
      return;
    }
    if (plocs.length === 1) {
      map.flyTo({ center: [plocs[0].lon, plocs[0].lat], zoom: 10, duration: 300 });
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
    if (isFinite(minLat) && isFinite(minLon) && isFinite(maxLat) && isFinite(maxLon)) {
      map.fitBounds(
        [
          [minLon, minLat],
          [maxLon, maxLat],
        ],
        { padding: 50, duration: 300 }
      );
    } else {
      map.flyTo({ center: INITIAL_CENTER, zoom: INITIAL_ZOOM, duration: 300 });
    }
  }, []);

  /**
   * Initialisiert die Mapbox-Karte.
   */
  const mapRefInit = useCallback(() => {
    if (!mapContainerRef.current) return;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/light-v10",
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
    });
    mapRef.current = map;
    popupRef.current = new mapboxgl.Popup({ closeButton: false, closeOnClick: false });

    map.on("load", () => {
      map.dragPan.enable();
      map.addSource("locations-source", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: "locations-layer",
        type: "circle",
        source: "locations-source",
        paint: {
          "circle-radius": 10,
          "circle-color": ["get", "overallColor"],
        },
      });

      map.addLayer({
        id: "locations-label",
        type: "symbol",
        source: "locations-source",
        layout: {
          "text-field": ["get", "overallAQI"],
          "text-size": 10,
        },
        paint: {
          "text-color": "#ffffff",
          "text-halo-color": "#000000",
          "text-halo-width": 1,
        },
      });

      const popup = popupRef.current!;
      map.on("mouseenter", "locations-layer", (e) => {
        map.getCanvas().style.cursor = "pointer";
        if (!e.features || !e.features[0]) return;
        const html = e.features[0].properties?.popupHTML || "";
        popup.setLngLat(e.lngLat).setHTML(html).addTo(map);
      });
      map.on("mouseleave", "locations-layer", () => {
        map.getCanvas().style.cursor = "";
        popup.remove();
      });

      map.addControl(new mapboxgl.NavigationControl(), "top-right");
      map.addControl(new mapboxgl.ScaleControl({ maxWidth: 100, unit: "metric" }), "bottom-left");

      // Befüllen der Karte mit Daten
      const plocs = processLocations(locations);
      setProcessedLocs(plocs);

      const geojson = createGeoJSON(plocs);
      const src = map.getSource("locations-source") as GeoJSONSource;
      src.setData(geojson);

      adjustMapView(map, plocs);
      if (onMapLoadEnd) onMapLoadEnd();
    });
  }, [locations, processLocations, createGeoJSON, adjustMapView, onMapLoadEnd]);

  /**
   * Initialisiert oder entfernt die Karte basierend auf dem ausgewählten Chart.
   */
  useEffect(() => {
    if (chart !== "2") {
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
   * Aktualisiert die Karte, wenn chart=3 und sich die Daten ändern.
   */
  useEffect(() => { 
    if (chart === "2" && mapRef.current && mapRef.current.isStyleLoaded()) {
      mapRef.current.resize();
      const plocs = processLocations(locations);
      setProcessedLocs(plocs);
      const geojson = createGeoJSON(plocs);
      const src = mapRef.current.getSource("locations-source") as GeoJSONSource;
      src.setData(geojson);

      adjustMapView(mapRef.current, plocs);
      if (onMapLoadEnd) onMapLoadEnd();
    }
  }, [chart, locations, processLocations, createGeoJSON, adjustMapView, onMapLoadEnd]);

  /**
   * Handhabt Plotly-Daten- und Layout-Updates basierend auf dem ausgewählten Chart.
   */
  useEffect(() => {
    if (!locations.length) {
      setPlotData([]);
      setPlotLayout({});
      return;
    }
    if (chart === "1") {
      // Streudiagramm
      const scatterData = calculateBigChart(chart, locations);
      if (!scatterData.length) {
        setPlotData([]);
        setPlotLayout({});
      } else {
        const scatterLayout = calculateBigLayout(chart, locations, width, height);
        setPlotData(scatterData);
        setPlotLayout(scatterLayout);
      }
      setRevision((r) => r + 1);
    } else {
      // Chart=3 (Karte) - Kein Plotly-Chart
      setPlotData([]);
      setPlotLayout({});
    }
  }, [chart, locations, width, height, processedLocs]);

  /**
   * Handhabt Mini-Chart-Updates für die Karte.
   */
  useEffect(() => {
    if (chart !== "2" || !processedLocs.length) {
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
      yaxis: { range: [0, upper], title: "" },
      // Use responsive sizing
      font: {
        size: (window.innerWidth < 600) ? 10 : 12,
      },
    };
    setMiniChartData(groupedData);
    setMiniChartLayout(miniLayout);
  }, [chart, processedLocs, activeCountryName]);

  /**
   * Handhabt Mausereignisse auf Sidebar-Listenelementen.
   */
  const handleCityMouseEnter = (ploc: ProcessedLocation) => {
    if (chart === "2" && mapRef.current && popupRef.current) {
      mapRef.current.flyTo({ center: [ploc.lon, ploc.lat], zoom: 10, duration: 300 });
    }
  };
  const handleCityMouseLeave = () => {
    // Keine Aktion erforderlich
  };
  const handleCityClick = (ploc: ProcessedLocation) => {
    if (chart === "2" && mapRef.current) {
      mapRef.current.flyTo({ center: [ploc.lon, ploc.lat], zoom: 10, duration: 300 });
    }
  };

  /**
   * Sichtbarkeit der Sidebar
   */
  const toggleSidebar = () => {
    setShowSidebar((prev) => {
      const newVal = !prev;
      if (chart === "2" && mapRef.current) {
        setTimeout(() => {
          mapRef.current?.resize();
          if (newVal) {
            centerMapOnCountry(); // Karte zentrieren, wenn die Sidebar geöffnet wird
          } else {
            adjustMapView(mapRef.current!, processedLocs);
          }
        }, 300);
      }
      return newVal;
    });
  };

  /**
   * Umschaltet die Sichtbarkeit des Mini-Charts.
   */
  const toggleMiniChart = () => setMiniChartExpanded((prev) => !prev);

  return (
    <Box display="flex">
      {/* Sidebar Drawer */}
      <Drawer
        variant="persistent"
        anchor="left"
        open={showSidebar && chart === "2"}
        sx={{
          "& .MuiDrawer-paper": {
            width: { xs: '100%', sm: 300 },
            boxSizing: "border-box",
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", p: 1, pt: 2, alignSelf: "center" }}>
       <Logo />
        </Box>

        <Box sx={{ p: 1, display: "flex", flexDirection: "column", gap: 1, flex: 1 }}>
          <Box sx={{ display: "flex", flexDirection: "row", gap: 1, alignItems: "center" }}>
            <TextField
              label="Search"
              variant="outlined"
              size="small"
              fullWidth
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-field"
            />
            <FormControl size="small" variant="outlined" className="choose-sort" sx={{ minWidth: 100 }}>
              <InputLabel>Sort</InputLabel>
              <Select
                label="Sort"
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as "name" | "aqi" | "pm25" | "pm10" | "so2" | "no2" | "co")}
              >
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="aqi">AQI</MenuItem>
                <MenuItem value="pm25">PM<sub>2.5</sub></MenuItem>
                <MenuItem value="pm10">PM<sub>10</sub></MenuItem>
                <MenuItem value="so2">SO<sub>2</sub></MenuItem>
                <MenuItem value="no2">NO<sub>2</sub></MenuItem>
                <MenuItem value="co">CO</MenuItem>
              </Select>
            </FormControl>
            <IconButton
              size="small"
              edge="start"
              onClick={() => setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))}
              className="sort-select"
            >
              {sortDirection === "asc" ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            </IconButton>

          <IconButton size="medium" onClick={toggleSidebar} className="close-list">
            <CloseCircleOutlined />
          </IconButton>
          </Box>

          {/* Stadtliste */}
          <List dense sx={{ flex: 1, overflowY: "auto" }}>
            {displayedLocs.map((ploc) => {
              const overallVal = computeOverallAqi(ploc.parameters);
              const bkgColor = aqiColor(overallVal) + "33";

              // Erstellen der Parameterzeilen für jeden Standort
              const paramLines: JSX.Element[] = [];
              for (const [p, v] of Object.entries(ploc.parameters)) {
                const subAqi = computeAqiForPollutant(p, v);
                if (subAqi < 0) continue; // Schließt ungültige aus
                const color = aqiColor(subAqi);
                paramLines.push(
                  <React.Fragment key={p}>
                    <Box component="span" sx={{ color: color, fontWeight: "bold" }}>
                      {formatParamNameJSX(p)}: {v.toFixed(2)} (AQI {subAqi})
                    </Box>
                    <br />
                  </React.Fragment>
                );
              }

              return (
                <ListItem
                  key={`${ploc.name}-${ploc.lat}-${ploc.lon}-${Math.random()}`}
                  button
                  onMouseEnter={() => handleCityMouseEnter(ploc)}
                  onMouseLeave={handleCityMouseLeave}
                  onClick={() => handleCityClick(ploc)}
                  sx={{ backgroundColor: bkgColor, borderRadius: 2, mb: 1 }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ fontWeight: "bold" }}>
                        {ploc.name}
                        {ploc.city ? `, ${ploc.city}` : ""}
                        <span style={{ float: "right", fontSize: "0.9rem" }}>
                          {overallVal < 0 ? "?" : overallVal}
                        </span>
                      </Box>
                    }
                    secondary={
                      <>
                        {paramLines}
                        {ploc.timestamp && (
                          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
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
      {showSidebar && chart === "2" && <Box sx={{ width: 300 }} />}

      {/* Haupt-Chart-Bereich */}
      <Box className="charts" sx={{ height: "95vh", display: "flex", flexDirection: "row" }}>
        {/* Sidebar-Umschaltknopf für die Karte */}
        {chart === "2" && !showSidebar && (
          <IconButton
            onClick={toggleSidebar}
            sx={{
              position: "fixed",
              top: 40,
              left: 35,
              borderRadius: 2,
              borderStyle: "solid",
              borderWidth: 0.5,
              zIndex: 1300,
              backgroundColor: "rgba(255,255,255,0.8)",
              "&:hover": { backgroundColor: "rgba(255,255,255,1)" },
            }}
            className="sidebar-toggle-button"
          >
            <MenuOutlined />
          </IconButton>
        )}

        <Box sx={{ flex: 1, height: "100%" }}>
          {chart === "2" ? (
            <>
              {/* Card Container */}
              <div ref={mapContainerRef} className="map-area" style={{ width: "100%", height: "100%" }} />

              {/* AQI-Legend */}
              <Box
              sx={{
                position: "absolute",
                bottom: 22,
                left: showSidebar && chart === "2" ? 310 : 10, // shift right by 300px + some padding
                backgroundColor: "rgba(255,255,255,0.8)",
                padding: "5px 10px",
                borderRadius: "4px",
                borderBottomLeftRadius: "0px",
                fontSize: "14px",
                fontFamily: "sans-serif",
                zIndex: 1,
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                transition: "left 0.3s ease-in-out", // smooth transition when sidebar toggles
              }}
            >
                <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                  AQI-Legend
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: "50%", mr: 1, background: "#2a9d8f" }} />
                  <Typography variant="body2">0-50 (Good)</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: "50%", mr: 1, background: "#e9c46a" }} />
                  <Typography variant="body2">51-100 (Moderate)</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: "50%", mr: 1, background: "#f4a261" }} />
                  <Typography variant="body2">101-150 (Unhealthy)</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: "50%", mr: 1, background: "#d62828" }} />
                  <Typography variant="body2">151-200 (Very Unhealthy)</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: "50%", mr: 1, background: "#9d0208" }} />
                  <Typography variant="body2">201+ (Hazardous)</Typography>
                </Box>
              </Box>

              {/* Mini-Durchschnittschart */}
              <Box
                className="average-plot"
                sx={{
                  position: "fixed",
                  bottom: 70,
                  right: 30,
                  width: miniChartExpanded ? 280 : 50,
                  height: miniChartExpanded ? 240 : 50,
                  backgroundColor: "rgba(255,255,255,0.8)",
                  borderRadius: 2,
                  padding: miniChartExpanded ? "5px" : "0px",
                  zIndex: 1200,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                  transition: "width 0.3s, height 0.3s",
                }}
              >
                <IconButton
                  size="small"
                  onClick={toggleMiniChart}
                  sx={{
                    position: "absolute",
                    top: 2,
                    right: 2,
                    zIndex: 1300,
                    border: "1px solid rgba(0,0,0,0.2)",
                    backgroundColor: "white",
                    "&:hover": { backgroundColor: "whitesmoke" },
                  }}
                >
                  {miniChartExpanded ? <CloseCircleOutlined /> : <ArrowUpOutlined />}
                </IconButton>
                {miniChartExpanded && miniChartData.length > 0 && (
                  <Box sx={{ width: "100%", height: "100%", backgroundColor: "rgba(255,255,255,0.8)" }}>
                    <Plot
                      data={miniChartData}
                      layout={miniChartLayout}
                      style={{ width: "100%", height: "100%" }}
                      config={{ displayModeBar: false }}
                    />
                  </Box>
                )}
              </Box>
            </>
          ) : plotData && plotData.length > 0 ? (
            <Box className="chart-area" sx={{ width: "100%", height: "100%" }}>
              <Plot
                data={plotData}
                layout={plotLayout}
                revision={revision}
                style={{ width: "100%", height: "100%" }}
                useResizeHandler
                config={{
                  displayModeBar: true,
                  responsive: true,
                }}
              />
            </Box>
          ) : (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
              <Typography variant="h6">No data available to display.</Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Chart;
