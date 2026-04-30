/**
 * @file MapContainer.tsx
 * @desc Manages the MapLibre map, including sources, layers, popups, and bounding logic.
 */
import React, { useCallback, useEffect } from 'react';
import maplibregl, { GeoJSONSource } from 'maplibre-gl';
import type { StyleSpecification } from 'maplibre-gl';
import { LatestResult } from '../../../../react-app-env';
import { ProcessedLocation } from '../ChartFunction';
import { Box } from '@mui/material';
import {
  INITIAL_CENTER,
  INITIAL_ZOOM,
} from '../chartUtilsHelpers/chartUtilsHelpers';

interface MapContainerProps {
  chart: string;
  locations: LatestResult[];
  mapRef: React.MutableRefObject<maplibregl.Map | null>;
  mapContainerRef: React.MutableRefObject<HTMLDivElement | null>;
  popupRef: React.MutableRefObject<maplibregl.Popup | null>;
  onMapLoadEnd?: () => void;
  processLocations: (locs: LatestResult[]) => ProcessedLocation[];
  createGeoJSON: (
    plocs: ProcessedLocation[]
  ) => GeoJSON.FeatureCollection<GeoJSON.Point>;
  adjustMapView: (map: maplibregl.Map, plocs: ProcessedLocation[]) => void;
  setProcessedLocs: React.Dispatch<React.SetStateAction<ProcessedLocation[]>>;
}

/**
 * @function MapContainer
 * @desc Renders the map container div and handles the MapLibre initialization if chart=2.
 */
const MapContainer: React.FC<MapContainerProps> = ({
  chart,
  locations,
  mapRef,
  mapContainerRef,
  popupRef,
  onMapLoadEnd,
  processLocations,
  createGeoJSON,
  adjustMapView,
  setProcessedLocs,
}) => {
  const initMap = useCallback(() => {
    if (!mapContainerRef.current) return;
    const rasterStyle: StyleSpecification = {
      version: 8,
      glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
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

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: rasterStyle,
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
    });
    mapRef.current = map;

    popupRef.current = new maplibregl.Popup({
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
          'text-font': ['Noto Sans Bold'],
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

      map.addControl(new maplibregl.NavigationControl(), 'top-right');
      map.addControl(
        new maplibregl.ScaleControl({ maxWidth: 100, unit: 'metric' }),
        'bottom-left'
      );

      // Process data
      const plocs = processLocations(locations);
      setProcessedLocs(plocs);

      const geojson = createGeoJSON(plocs);
      const src = map.getSource('locations-source') as GeoJSONSource;
      src.setData(geojson);

      adjustMapView(map, plocs);
      if (onMapLoadEnd) onMapLoadEnd();
    });
  }, [
    mapContainerRef,
    popupRef,
    processLocations,
    createGeoJSON,
    adjustMapView,
    locations,
    setProcessedLocs,
    onMapLoadEnd,
  ]);

  useEffect(() => {
    if (chart !== '2') {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      return;
    }
    if (!mapRef.current && mapContainerRef.current) {
      initMap();
    }
  }, [chart, initMap]);

  useEffect(() => {
    if (
      chart === '2' &&
      mapRef.current &&
      mapRef.current.isStyleLoaded() &&
      mapRef.current.resize
    ) {
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
    setProcessedLocs,
  ]);

  return (
    <Box
      ref={mapContainerRef}
      className="map-area"
      sx={{ width: '100%', height: '100%' }}
    />
  );
};

export default MapContainer;
