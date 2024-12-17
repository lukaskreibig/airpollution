import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import Plot from "react-plotly.js";
import mapboxgl from 'mapbox-gl';
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
  Typography 
} from '@mui/material';
import { ArrowDownOutlined, ArrowUpOutlined, CloseCircleOutlined, MenuOutlined } from "@ant-design/icons";

import { LatestResult, Country } from "../../../react-app-env";
import {
  calculateBigChart,
  calculateBigLayout,
  calculateAverageChart,
  calculateAverageLayout,
} from "./ChartFunction"; // Pure utility functions
import { PlotData } from "plotly.js";

// Hook for window dimensions
function useWindowDimensions() {
  const [dims, setDims] = useState({ width: window.innerWidth, height: window.innerHeight });
  useEffect(() => {
    const handleResize = () => setDims({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return dims;
}

function getPMColor(value: number): string {
  if (value > 55.5) return "#9d0208";  // Hazardous
  if (value > 35.4) return "#d62828";  // Unhealthy
  if (value > 12)   return "#f4a261";  // Moderate
  return "#2a9d8f";                    // Safe
}

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
  onMapLoadEnd?: () => void; // optional
};

// Default Mapbox settings
const INITIAL_CENTER: [number, number] = [-74.0242, 40.6941];
const INITIAL_ZOOM = 10.12;
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || '';

const Chart: React.FC<Props> = ({
  chart,
  locations,
  country,
  countriesList,
  showSidebar,
  setShowSidebar,
  onMapLoadEnd
}) => {
  const { width, height } = useWindowDimensions();

  // Plotly "main" chart states
  const [data, setData] = useState<Partial<PlotData>[]>([]);
  const [layout, setLayout] = useState<Partial<Plotly.Layout>>({});
  const [revision, setRevision] = useState<number>(0);

  // Mini average chart states
  const [miniChartData, setMiniChartData] = useState<Partial<PlotData>[]>([]);
  const [miniChartLayout, setMiniChartLayout] = useState<Partial<Plotly.Layout>>({});
  const [miniChartExpanded, setMiniChartExpanded] = useState(true);

  // Map references
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  // Searching/Sorting states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<'name'|'pm25'|'pm10'>('name');
  const [sortDirection, setSortDirection] = useState<'asc'|'desc'>('asc');
  const [processedLocs, setProcessedLocs] = useState<ProcessedLocation[]>([]);

  // Reset search on country change
  useEffect(() => {
    setSearchQuery('');
  }, [country]);

  // Identify active country name for chart titles
  const activeCountryName = useMemo(() => {
    const found = countriesList.find(c => String(c.id) === country);
    return found ? found.name : "Unknown Country";
  }, [country, countriesList]);

  // Convert LatestResult -> ProcessedLocation
  const processLocations = useCallback((locs: LatestResult[]): ProcessedLocation[] => {
    return locs.map(loc => {
      if (!loc.coordinates) return null;
      const pm25 = loc.measurements.find(m=>m.parameter==='pm25')?.value;
      const pm10 = loc.measurements.find(m=>m.parameter==='pm10')?.value;
      if(pm25 === undefined && pm10 === undefined) return null;

      let text = `<div style="font-size:14px;line-height:1.4;">`;
      const locName = typeof loc.location==='string'? loc.location:"Unknown";
      text += `<strong>${locName}</strong><br/>`;
      if(loc.city) text += `City: ${loc.city}<br/>`;
      if(pm25!==undefined) text += `PM2.5: ${pm25.toFixed(2)} µg/m³<br/>`;
      if(pm10!==undefined) text += `PM10: ${pm10.toFixed(2)} µg/m³<br/>`;
      text += `</div>`;

      return {
        name: locName,
        city: typeof loc.city==='string'? loc.city: undefined,
        pm25,
        pm10,
        lat: loc.coordinates.latitude,
        lon: loc.coordinates.longitude,
        text
      } as ProcessedLocation;
    }).filter((f):f is ProcessedLocation => f!==null);
  },[]);

  // Create GeoJSON
  const createGeoJSON = useCallback((plocs: ProcessedLocation[]): GeoJSON.FeatureCollection<GeoJSON.Point> => {
    const features = plocs.map(ploc => ({
      type: "Feature" as const,
      geometry: {
        type:"Point" as const,
        coordinates:[ploc.lon, ploc.lat]
      },
      properties:{
        text: ploc.text,
        pm25: ploc.pm25??0,
        pm10: ploc.pm10??0,
      }
    }));
    return { type:'FeatureCollection', features };
  },[]);

  // Update processedLocs whenever locations changes
  useEffect(() => {
    const plocs = processLocations(locations);
    setProcessedLocs(plocs);
  }, [locations, processLocations]);

  // Filter + sort city list
  const displayedLocs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = processedLocs.filter(ploc => {
      if(!q) return true;
      const nameMatch = ploc.name.toLowerCase().includes(q);
      const cityMatch = ploc.city?.toLowerCase().includes(q) ?? false;
      return nameMatch || cityMatch;
    });

    const sorted = [...filtered].sort((a,b)=>{
      let comparison=0;
      if (sortMode === "pm25") {
        comparison=(a.pm25 ?? 0) - (b.pm25 ?? 0);
      } else if (sortMode==="pm10") {
        comparison=(a.pm10 ?? 0) - (b.pm10 ?? 0);
      } else if (sortMode==="name") {
        comparison= a.name.localeCompare(b.name);
      }
      return sortDirection==="asc"? comparison:-comparison;
    });
    return sorted;
  }, [processedLocs, searchQuery, sortMode, sortDirection]);

  // Adjust map view
  const adjustMapView = useCallback((map: mapboxgl.Map, plocs: ProcessedLocation[])=>{
    if(plocs.length===0){
      map.flyTo({ center:INITIAL_CENTER, zoom:INITIAL_ZOOM, duration:300 });
      return;
    }
    if(plocs.length===1){
      map.flyTo({ center:[plocs[0].lon, plocs[0].lat], zoom:10, duration:300});
      return;
    }
    let minLat=Infinity, maxLat=-Infinity, minLon=Infinity, maxLon=-Infinity;
    for(const p of plocs){
      if(p.lat<minLat) minLat=p.lat;
      if(p.lat>maxLat) maxLat=p.lat;
      if(p.lon<minLon) minLon=p.lon;
      if(p.lon>maxLon) maxLon=p.lon;
    }
    if(isFinite(minLat) && isFinite(minLon) && isFinite(maxLat) && isFinite(maxLon)){
      map.fitBounds([[minLon, minLat],[maxLon, maxLat]], { padding:50, duration:300 });
    } else {
      map.flyTo({ center:INITIAL_CENTER, zoom:INITIAL_ZOOM, duration:300 });
    }
  },[]);

  // Initialize / remove map
  useEffect(()=>{
    if(chart!=="3"){
      if(mapRef.current){
        mapRef.current.remove();
        mapRef.current=null;
      }
      return;
    }
    if(!mapRef.current && mapContainerRef.current){
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style:'mapbox://styles/mapbox/light-v10',
        center:INITIAL_CENTER,
        zoom:INITIAL_ZOOM
      });
      mapRef.current=map;
      popupRef.current=new mapboxgl.Popup({ closeButton:false, closeOnClick:false });

      map.on('load', ()=>{
        map.dragPan.enable();
        if(!map.getSource("locations-source")){
          map.addSource("locations-source", {
            type:"geojson",
            data:{ type:"FeatureCollection", features:[]}
          });
          // threshold color
          map.addLayer({
            id:'locations-layer',
            type:'circle',
            source:'locations-source',
            paint:{
              'circle-radius':6,
              'circle-color': [
                "case",
                [">", ["max",["get","pm25"],["get","pm10"]], 55.5], "#9d0208",
                [">", ["max",["get","pm25"],["get","pm10"]], 35.4], "#d62828",
                [">", ["max",["get","pm25"],["get","pm10"]], 12], "#f4a261",
                "#2a9d8f"
              ]
            }
          });

          const popup = popupRef.current!;
          map.on('mouseenter','locations-layer', e=>{
            map.getCanvas().style.cursor='pointer';
            if(!e.features||!e.features[0])return;
            const text = e.features[0].properties?.text || "";
            popup.setLngLat(e.lngLat).setHTML(text).addTo(map);
          });
          map.on('mouseleave','locations-layer',()=>{
            map.getCanvas().style.cursor='';
            popup.remove();
          });

          map.addControl(new mapboxgl.NavigationControl(),'top-right');
          map.addControl(new mapboxgl.ScaleControl({maxWidth:100,unit:'metric'}),'bottom-left');

          const plocs = processLocations(locations);
          setProcessedLocs(plocs);
          const geojson = createGeoJSON(plocs);
          const src = map.getSource('locations-source') as mapboxgl.GeoJSONSource;
          if(src) src.setData(geojson);
          adjustMapView(map, plocs);
        }
        if(onMapLoadEnd) onMapLoadEnd();
      });
    }
  }, [chart, locations, processLocations, createGeoJSON, adjustMapView, onMapLoadEnd]);

  // Update map data
  useEffect(()=>{
    if(chart==="3" && mapRef.current && mapRef.current.isStyleLoaded()){
      const map = mapRef.current;
      const plocs = processLocations(locations);
      setProcessedLocs(plocs);
      const geojson = createGeoJSON(plocs);
      const src = map.getSource('locations-source') as mapboxgl.GeoJSONSource;
      if(src) src.setData(geojson);
      adjustMapView(map, plocs);
    }
  }, [chart, locations, country, processLocations, createGeoJSON, adjustMapView]);

  // Main Plotly chart logic
  const [mainData, setMainData] = useState<Partial<PlotData>[]>([]);
  const [mainLayout, setMainLayout] = useState<Partial<Plotly.Layout>>({});

  useEffect(()=>{
    if(!locations|| locations.length===0){
      setMainData([]);
      setMainLayout({});
      setData([]);
      setLayout({});
      return;
    }
    if(chart==="1"){
      const dataCalc = calculateBigChart(chart, locations);
      const layoutCalc = calculateBigLayout(chart, locations, width, height);
      const updatedLayout: Partial<Plotly.Layout> = {
        ...layoutCalc,
        transition:{ duration:200, easing:"linear-in-out", ordering:"traces first"}
      };
      setMainData(dataCalc);
      setMainLayout(updatedLayout);
      setData(dataCalc);
      setLayout(updatedLayout);
      setRevision(prev=>prev+1);
    } else if(chart==="2"){
      const { data:barData, averages } = calculateAverageChart(locations);
      const layoutCalc = calculateAverageLayout(averages, width, height);
      const updatedLayout: Partial<Plotly.Layout> = {
        ...layoutCalc,
        transition:{ duration:200, easing:"linear-in-out", ordering:"traces first"}
      };
      setMainData(barData);
      setMainLayout(updatedLayout);
      setData(barData);
      setLayout(updatedLayout);
      setRevision(prev=>prev+1);
    } else {
      // if chart===3 or others, clear
      setMainData([]);
      setMainLayout({});
      setData([]);
      setLayout({});
    }
  }, [chart, locations, width, height]);

  useEffect(()=>{
    if(chart!=="3"){
      setMiniChartData([]);
      setMiniChartLayout({});
      return;
    }
    if(!locations.length){
      setMiniChartData([]);
      setMiniChartLayout({});
      return;
    }
    const { data:avgData, averages } = calculateAverageChart(locations);
    const layoutCalc = calculateAverageLayout(averages, 260, 210);
    layoutCalc.margin = { l:30, r:20, t:30, b:35 };
    layoutCalc.title = `Average in ${activeCountryName}`;
    if(layoutCalc.annotations) layoutCalc.annotations = [];
    delete layoutCalc.transition;

    setMiniChartData(avgData);
    setMiniChartLayout(layoutCalc);
  }, [chart, locations, activeCountryName]);

  const mainPlotConfig: Partial<Plotly.Config> = { responsive:true };
  const miniPlotConfig: Partial<Plotly.Config> = {
    responsive:true,
    displayModeBar:false,
  };

  const handleCityMouseEnter = (ploc: ProcessedLocation) => {
    if(chart==="3" && mapRef.current && popupRef.current){
      popupRef.current.setLngLat([ploc.lon, ploc.lat]).setHTML(ploc.text).addTo(mapRef.current);
    }
  };
  const handleCityMouseLeave = () => {
    if(chart==="3" && popupRef.current){
      popupRef.current.remove();
    }
  };
  const handleCityClick = (ploc:ProcessedLocation) => {
    if(chart==="3" && mapRef.current){
      mapRef.current.flyTo({ center:[ploc.lon, ploc.lat], zoom:10, duration:300});
    }
  };

  const toggleSidebar = ()=> setShowSidebar(prev=>!prev);
  const toggleMiniChart = ()=> setMiniChartExpanded(prev=>!prev);

  return (
    <Box display="flex">
      <Drawer
        variant="persistent"
        anchor="left"
        open={showSidebar}
        sx={{ "& .MuiDrawer-paper": { width:300, boxSizing:"border-box"} }}
      >
        <Box sx={{ display:"flex", alignItems:"center", p:1, justifyContent:"space-between"}}>
          <Typography variant="h6">Cities</Typography>
          <IconButton size="medium" onClick={toggleSidebar} className="close-list">
            <CloseCircleOutlined/>
          </IconButton>
        </Box>
        <Box sx={{ p:1, display:"flex", flexDirection:"column", gap:1, flex:1 }}>
          <Box sx={{ display:"flex", flexDirection:"row", gap:1, alignItems:"center"}}>
            <TextField
              label="Search"
              variant="outlined"
              size="small"
              fullWidth
              value={searchQuery}
              onChange={e=>setSearchQuery(e.target.value)}
              className="search-field"
            />
            <FormControl
              size="small"
              variant="outlined"
              className="choose-sort"
              sx={{ minWidth:100}}
            >
              <InputLabel>Sort</InputLabel>
              <Select
                label="Sort"
                value={sortMode}
                onChange={e=> setSortMode(e.target.value as 'name'|'pm25'|'pm10')}
              >
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="pm25">PM2.5</MenuItem>
                <MenuItem value="pm10">PM10</MenuItem>
              </Select>
            </FormControl>
            <IconButton
              size="small"
              edge="start"
              onClick={()=> setSortDirection(prev=> (prev==="asc"? "desc":"asc"))}
              className="sort-select"
            >
              {sortDirection==="asc"? <ArrowUpOutlined/> : <ArrowDownOutlined/>}
            </IconButton>
          </Box>

          {/* City List */}
          <List dense sx={{ flex:1, overflowY:"auto" }}>
            {displayedLocs.map(ploc=>{
              const pm25Color = getPMColor(ploc.pm25??0);
              const pm10Color = getPMColor(ploc.pm10??0);

              return (
                <ListItem
                  key={`${ploc.name}-${ploc.city??''}-${ploc.lat}-${ploc.lon}`}
                  button
                  onMouseEnter={()=> handleCityMouseEnter(ploc)}
                  onMouseLeave={handleCityMouseLeave}
                  onClick={()=> handleCityClick(ploc)}
                >
                  <ListItemText
                    primary={`${ploc.name}${ploc.city?`, ${ploc.city}`:''}`}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" sx={{ color: pm25Color }}>
                          PM2.5: {ploc.pm25?.toFixed(2)??'N/A'} µg/m³
                        </Typography>
                        {" | "}
                        <Typography component="span" variant="body2" sx={{ color: pm10Color }}>
                          PM10: {ploc.pm10?.toFixed(2)??'N/A'} µg/m³
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Drawer>
      {showSidebar && <Box sx={{ width:300}}/>}

      <Box className="charts" sx={{ height:"95vh", display:"flex", flexDirection:"row"}}>
        {chart==="3" && !showSidebar && (
          <IconButton
            onClick={toggleSidebar}
            sx={{
              position:"fixed",
              top:40,
              left:35,
              borderRadius:2,
              borderStyle:"solid",
              borderWidth:0.5,
              zIndex:1300,
              backgroundColor:"rgba(255, 255, 255, 0.8)",
              "&:hover":{ backgroundColor:"rgba(255, 255, 255,1)"}
            }}
            className="sidebar-toggle-button"
          >
            <MenuOutlined/>
          </IconButton>
        )}

        <Box sx={{ flex:1, height:"100%" }}>
          {chart==="3"? (
            <>
              <div ref={mapContainerRef} className="map-area" style={{ width:"100%", height:"100%"}}/>

              {/* Legend */}
              <Box
                sx={{
                  position:'absolute',
                  bottom:'61px',
                  left:'10px',
                  background:'rgba(255,255,255,0.8)',
                  padding:'5px 10px',
                  borderRadius:'4px',
                  fontSize:'14px',
                  fontFamily:'sans-serif',
                  zIndex:1,
                  display:'flex',
                  flexDirection:'column',
                  gap:'4px'
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight:'bold'}}>PM2.5/PM10 Thresholds</Typography>
                <Box sx={{ display:"flex", alignItems:"center"}}>
                  <Box sx={{display:"inline-block", width:"10px",height:"10px", borderRadius:"50%", marginRight:"5px", background:"#2a9d8f"}}/>
                  <Typography variant="body2">Safe (&lt;12)</Typography>
                </Box>
                <Box sx={{ display:"flex", alignItems:"center"}}>
                  <Box sx={{display:"inline-block", width:"10px",height:"10px", borderRadius:"50%", marginRight:"5px", background:"#f4a261"}}/>
                  <Typography variant="body2">Moderate (12-35.4)</Typography>
                </Box>
                <Box sx={{ display:"flex", alignItems:"center"}}>
                  <Box sx={{display:"inline-block", width:"10px",height:"10px", borderRadius:"50%", marginRight:"5px", background:"#d62828"}}/>
                  <Typography variant="body2">Unhealthy (35.5-55.4)</Typography>
                </Box>
                <Box sx={{ display:"flex", alignItems:"center"}}>
                  <Box sx={{display:"inline-block", width:"10px",height:"10px", borderRadius:"50%", marginRight:"5px", background:"#9d0208"}}/>
                  <Typography variant="body2">Hazardous (&gt;55.5)</Typography>
                </Box>
              </Box>

              {/* Bottom-right mini average chart */}
              <Box
                className="average-plot"
                sx={{
                  position:"fixed",
                  bottom:40,
                  right:40,
                  width: miniChartExpanded?  280 : 50,
                  height: miniChartExpanded? 240 : 50,
                  backgroundColor:"rgba(255,255,255,0.8)",
                  borderRadius:2,
                  padding: miniChartExpanded?"5px":"0px",
                  zIndex:1200,
                  boxShadow:"0 2px 6px rgba(0,0,0,0.15)",
                  transition:"width 0.3s, height 0.3s"
                }}
              >
                <IconButton
                  size="small"
                  onClick={()=> setMiniChartExpanded(prev=>!prev)}
                  sx={{
                    position:"absolute",
                    top:2,
                    right:2,
                    zIndex:1300,
                    border:"1px solid rgba(0,0,0,0.2)",
                    backgroundColor:"white",
                    "&:hover":{ backgroundColor:"whitesmoke"}
                  }}
                >
                  {miniChartExpanded? <CloseCircleOutlined/>: <ArrowUpOutlined/>}
                </IconButton>
                {miniChartExpanded && miniChartData.length>0 && (
                  <Box sx={{ width:"100%", height:"100%", backgroundColor:"rgba(255,255,255,0.8)",
                }}>
                    <Plot
                      data={miniChartData}
                      layout={miniChartLayout}
                      style={{ width:"100%", height:"100%", backgroundColor:"rgba(255,255,255,0.8)",
                    }}
                      config={{
                        displayModeBar:false,
                      }}
                    />
                  </Box>
                )}
              </Box>
            </>
          ) : (
            data && data.length>0 ? (
              <Box className="chart-area" sx={{ width:"100%", height:"100%"}}>
                <Plot
                  data={data}
                  layout={layout}
                  revision={revision}
                  style={{ width:"100%", height:"100%"}}
                  useResizeHandler
                  config={{
                    displayModeBar:true,
                    responsive:true
                  }}
                />
              </Box>
            ) : (
              <Box sx={{display:"flex", justifyContent:"center", alignItems:"center", height:"100%"}}>
                <Typography variant="h6">No data available to display the chart.</Typography>
              </Box>
            )
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Chart;
