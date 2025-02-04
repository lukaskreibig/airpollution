import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl, { GeoJSONSource, LngLatBoundsLike } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { aqiColor } from './chartUtilsHelpers/chartUtilsHelpers';

interface ChartProps {
  waqiData?: Array<any>;
  locations?: Array<any>;
  chart?: string;
  country?: string;
  countriesList?: Array<any>;
  showSidebar?: boolean;
  setShowSidebar?: React.Dispatch<React.SetStateAction<boolean>>;
  onDataChange?: (data: any[]) => void;
  onMapMoveEnd?: (bbox: string) => void;
  onMarkerHover?: (properties: any | null) => void;
}

const Chart: React.FC<ChartProps> = ({
  waqiData,
  locations,
  onDataChange,
  onMapMoveEnd,
  onMarkerHover,
}) => {
  // Instead of toggling layers with a button, we'll auto-switch by zoom level
  // So we no longer need a 'viewType' state.
  const initialData = waqiData || locations || [];
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [markersData, setMarkersData] = useState<any[]>(initialData);
  const initialFitDoneRef = useRef<boolean>(false);

  // Function to update the GeoJSON source with new features
  const updateMapSource = useCallback(() => {
    if (!mapRef.current) return;
    const features: GeoJSON.Feature<GeoJSON.Point>[] = markersData.map(
      (item) => {
        const aqiNum = Number(item.aqi);
        return {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [item.lon, item.lat] },
          properties: {
            aqi: aqiNum,
            station: item.station.name,
            overallAQI: aqiNum,
            overallColor: aqiColor(aqiNum),
            popupHTML: `<h4>${item.station.name}</h4><p>AQI: ${item.aqi}</p>`,
          },
        };
      }
    );
    const source = mapRef.current.getSource('stations') as GeoJSONSource;
    if (source) {
      source.setData({ type: 'FeatureCollection', features });
    }
  }, [markersData]);

  // Initialize map (runs only once)
  useEffect(() => {
    if (!mapContainerRef.current) return;
    mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || '';
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v10',
      center: [0, 0],
      zoom: 2,
    });
    mapRef.current = map;

    map.on('load', () => {
      // Create source
      map.addSource('stations', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      // --- HEATMAP LAYER ---
      // We show this by default at lower zoom, so let's start it 'visible'.
      map.addLayer({
        id: 'heatmap-layer',
        type: 'heatmap',
        source: 'stations',
        layout: {
          visibility: 'visible', // shown initially
        },
        maxzoom: 15,
        paint: {
          // Weighted by the AQI property so "heatmap-density" reflects sum of AQIs
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'aqi'],
            0,
            0,
            50,
            0.2,
            100,
            0.4,
            150,
            0.6,
            200,
            0.8,
            300,
            1,
            // Optionally push above 1 if you want extremely high AQIs to dominate
            500,
            2,
          ],
          'heatmap-intensity': [
            'interpolate',
            ['exponential', 1.5],
            ['zoom'],
            0,
            0.7,
            15,
            7,
          ],
          'heatmap-radius': [
            'interpolate',
            ['exponential', 1.5],
            ['zoom'],
            0,
            12,
            15,
            40,
          ],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0,
            'rgba(0, 228, 0, 0)', // transparent at zero
            0.1,
            '#00E400', // Good
            0.2,
            '#FFFF00', // Moderate
            0.4,
            '#FF7E00', // USG
            0.6,
            '#FF0000', // Unhealthy
            0.8,
            '#99004C', // Very Unhealthy
            1,
            '#7E0023', // Hazardous
          ],
          'heatmap-opacity': 0.8,
        },
      });

      // --- DOTS LAYER ---
      // Hidden by default so it only appears at higher zoom
      map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'stations',
        minzoom: 0,
        layout: {
          visibility: 'none', // hidden initially
        },
        paint: {
          'circle-color': ['get', 'overallColor'],
          'circle-radius': 10,
        },
      });

      // --- TEXT LABELS ON THE DOTS ---
      // Also hidden initially
      map.addLayer({
        id: 'unclustered-point-label',
        type: 'symbol',
        source: 'stations',
        minzoom: 0,
        layout: {
          'text-field': ['to-string', ['get', 'aqi']],
          'text-size': 12,
          'text-offset': [0, 0.6],
          'text-anchor': 'bottom',
          visibility: 'none',
        },
        paint: {
          'text-color': '#000',
        },
      });

      // When user hovers over a circle, trigger callback with that point's properties
      map.on('mouseenter', 'unclustered-point', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        const feature = e.features && e.features[0];
        if (feature && onMarkerHover) {
          onMarkerHover(feature.properties);
        }
      });
      map.on('mouseleave', 'unclustered-point', () => {
        map.getCanvas().style.cursor = '';
        if (onMarkerHover) {
          onMarkerHover(null);
        }
      });

      // On map move, notify parent about new bounding box
      map.on('moveend', () => {
        const zoom = map.getZoom();
        if (zoom > 12) return;
        const bounds = map.getBounds();
        const bbox = `${bounds.getSouthWest().lat},${bounds.getSouthWest().lng},${bounds.getNorthEast().lat},${bounds.getNorthEast().lng}`;
        if (onMapMoveEnd) {
          onMapMoveEnd(bbox);
        }
      });

      // -------- AUTO-SWITCH LAYERS BASED ON ZOOM -------
      map.on('zoomend', () => {
        const currentZoom = map.getZoom();
        // You can tweak the number "5" to e.g. 6 or 4 if you prefer.
        if (currentZoom < 4) {
          // Show heatmap at lower zoom
          map.setLayoutProperty('heatmap-layer', 'visibility', 'visible');
          map.setLayoutProperty('unclustered-point', 'visibility', 'none');
          map.setLayoutProperty(
            'unclustered-point-label',
            'visibility',
            'none'
          );
        } else {
          // Hide heatmap, show dots at higher zoom
          map.setLayoutProperty('heatmap-layer', 'visibility', 'none');
          map.setLayoutProperty('unclustered-point', 'visibility', 'visible');
          map.setLayoutProperty(
            'unclustered-point-label',
            'visibility',
            'visible'
          );
        }
      });
      // ----------------------------------------------

      // Immediately update the source once loaded
      updateMapSource();

      // Fit bounds once using the initial data if available
      if (!initialFitDoneRef.current && initialData.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        initialData.forEach((item) => {
          bounds.extend([item.lon, item.lat]);
        });
        map.fitBounds(bounds as LngLatBoundsLike, {
          padding: 20,
          duration: 0,
        });
        initialFitDoneRef.current = true;
      }
    });
  }, [onMapMoveEnd]); // updateMapSource is called inside 'load', no need to re-run

  // Update markersData, filtering out items with "-" as aqi
  useEffect(() => {
    setMarkersData(
      (waqiData || locations || []).filter((item) => item.aqi !== '-')
    );
  }, [waqiData, locations]);

  // Whenever markersData changes, update the geojson source
  useEffect(() => {
    if (mapRef.current && mapRef.current.isStyleLoaded()) {
      updateMapSource();
    }
  }, [markersData, updateMapSource]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Removed toggle button. We rely on auto-switch by zoom. */}
      <div
        ref={mapContainerRef}
        className="map-area"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default React.memo(Chart);
