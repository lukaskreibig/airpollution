/**
 * @file MapContainer.tsx
 * @desc Manages the Mapbox map, including sources, layers, popups, and bounding logic.
 */
import React, { useCallback, useEffect } from 'react';
import mapboxgl, { GeoJSONSource } from 'mapbox-gl';
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
  mapRef: React.MutableRefObject<mapboxgl.Map | null>;
  mapContainerRef: React.MutableRefObject<HTMLDivElement | null>;
  popupRef: React.MutableRefObject<mapboxgl.Popup | null>;
  onMapLoadEnd?: () => void;
  processLocations: (locs: LatestResult[]) => ProcessedLocation[];
  createGeoJSON: (
    plocs: ProcessedLocation[]
  ) => GeoJSON.FeatureCollection<GeoJSON.Point>;
  adjustMapView: (map: mapboxgl.Map, plocs: ProcessedLocation[]) => void;
  setProcessedLocs: React.Dispatch<React.SetStateAction<ProcessedLocation[]>>;
}

/**
 * @function MapContainer
 * @desc Renders the map container div and handles the Mapbox initialization if chart=2.
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
