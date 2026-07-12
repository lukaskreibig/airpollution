import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import maplibregl, { GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import { AirQualityStation } from '../../aqi';
import { MapFocusTarget } from '../../mapFocus';
import Legend from './Legend';
import {
  MAP_STYLE,
  MAP_TEXT_FONT,
  aqiStepColor,
  buildGeoJSON,
  clusterPopupHtml,
  stationPopupHtml,
} from './mapStyle';

type MapStatus = 'idle' | 'ready' | 'unsupported' | 'error';
export type MapMode = 'stations' | 'field';

interface MapViewProps {
  stations: AirQualityStation[];
  focusTarget?: MapFocusTarget | null;
  selectedStationId: string | null;
  onSelectStation: (station: AirQualityStation) => void;
  onMapLoadEnd: () => void;
  onBoundsChange: (bounds: string) => void;
}

function getMapBoundsString(map: maplibregl.Map): string {
  const bounds = map.getBounds();
  if (!bounds) return '-85,-180,85,180';
  const southWest = bounds.getSouthWest();
  const northEast = bounds.getNorthEast();
  return [southWest.lat, southWest.lng, northEast.lat, northEast.lng].join(',');
}

function canCreateWebGlContext(): boolean {
  if (typeof document === 'undefined') return true;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')
    );
  } catch {
    return false;
  }
}

const STATION_LAYERS = [
  'station-glow',
  'station-core',
  'station-label',
  'clusters-glow',
  'clusters',
  'cluster-label',
];
const FIELD_LAYERS = ['aqi-heat', 'field-core'];

const MapView: React.FC<MapViewProps> = ({
  stations,
  focusTarget,
  selectedStationId,
  onSelectStation,
  onMapLoadEnd,
  onBoundsChange,
}) => {
  const [mapStatus, setMapStatus] = useState<MapStatus>('idle');
  const [mode, setMode] = useState<MapMode>('stations');

  const mapRef = useRef<maplibregl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const stationsRef = useRef<AirQualityStation[]>(stations);
  const modeRef = useRef<MapMode>(mode);

  const geojson = useMemo(() => buildGeoJSON(stations), [stations]);

  useEffect(() => {
    stationsRef.current = stations;
  }, [stations]);

  const applyMode = useCallback((map: maplibregl.Map, nextMode: MapMode) => {
    STATION_LAYERS.forEach((layer) => {
      if (map.getLayer(layer)) {
        map.setLayoutProperty(
          layer,
          'visibility',
          nextMode === 'stations' ? 'visible' : 'none'
        );
      }
    });
    FIELD_LAYERS.forEach((layer) => {
      if (map.getLayer(layer)) {
        map.setLayoutProperty(
          layer,
          'visibility',
          nextMode === 'field' ? 'visible' : 'none'
        );
      }
    });
  }, []);

  /* Initialize once. */
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return undefined;

    if (!canCreateWebGlContext()) {
      setMapStatus('unsupported');
      onMapLoadEnd();
      return undefined;
    }

    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: MAP_STYLE,
        center: [12, 26],
        zoom: 1.7,
        attributionControl: { compact: true },
      });
    } catch {
      setMapStatus('error');
      onMapLoadEnd();
      return undefined;
    }

    mapRef.current = map;
    let mapHasLoaded = false;

    popupRef.current = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 14,
      maxWidth: '280px',
    });

    map.on('error', () => {
      if (!mapHasLoaded) {
        setMapStatus('error');
        onMapLoadEnd();
      }
    });

    map.on('load', () => {
      mapHasLoaded = true;

      map.addSource('stations', {
        type: 'geojson',
        data: buildGeoJSON([]),
        cluster: true,
        clusterMaxZoom: 5,
        clusterRadius: 40,
        clusterProperties: {
          sumAQI: ['+', ['to-number', ['get', 'aqi']]],
          maxAQI: ['max', ['to-number', ['get', 'aqi']]],
        },
      });

      map.addSource('stations-raw', {
        type: 'geojson',
        data: buildGeoJSON([]),
      });

      const meanAqi = [
        '/',
        ['get', 'sumAQI'],
        ['max', ['get', 'point_count'], 1],
      ];

      /* --- Pollution field (heatmap) --- */
      map.addLayer({
        id: 'aqi-heat',
        type: 'heatmap',
        source: 'stations-raw',
        layout: { visibility: 'none' },
        paint: {
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['to-number', ['get', 'aqi']],
            0,
            0.02,
            50,
            0.18,
            100,
            0.42,
            200,
            0.75,
            300,
            1,
          ],
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0,
            0.9,
            6,
            1.8,
            10,
            2.6,
          ],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0,
            'rgba(6,10,18,0)',
            0.12,
            'rgba(69,214,161,0.30)',
            0.32,
            'rgba(245,212,69,0.40)',
            0.52,
            'rgba(247,155,76,0.48)',
            0.72,
            'rgba(244,98,111,0.55)',
            1,
            'rgba(176,126,242,0.62)',
          ],
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0,
            16,
            5,
            42,
            10,
            72,
          ],
          'heatmap-opacity': 0.9,
        },
      } as maplibregl.LayerSpecification);

      map.addLayer({
        id: 'field-core',
        type: 'circle',
        source: 'stations-raw',
        layout: { visibility: 'none' },
        paint: {
          'circle-radius': 2.4,
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.85,
        },
      } as maplibregl.LayerSpecification);

      /* --- Cluster bubbles --- */
      map.addLayer({
        id: 'clusters-glow',
        type: 'circle',
        source: 'stations',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': aqiStepColor(meanAqi),
          'circle-radius': ['step', ['get', 'point_count'], 26, 20, 32, 80, 40],
          'circle-blur': 1,
          'circle-opacity': 0.4,
        },
      } as maplibregl.LayerSpecification);

      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'stations',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': aqiStepColor(meanAqi),
          'circle-radius': ['step', ['get', 'point_count'], 15, 20, 19, 80, 25],
          'circle-opacity': 0.92,
          'circle-stroke-color': 'rgba(6,10,18,0.85)',
          'circle-stroke-width': 2,
        },
      } as maplibregl.LayerSpecification);

      map.addLayer({
        id: 'cluster-label',
        type: 'symbol',
        source: 'stations',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-size': 12,
          'text-font': MAP_TEXT_FONT,
        },
        paint: {
          'text-color': '#081018',
        },
      } as maplibregl.LayerSpecification);

      /* --- Individual stations: glow halo + bright core + value --- */
      map.addLayer({
        id: 'station-glow',
        type: 'circle',
        source: 'stations',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 10, 8, 20],
          'circle-color': ['get', 'color'],
          'circle-blur': 1,
          'circle-opacity': 0.5,
        },
      } as maplibregl.LayerSpecification);

      map.addLayer({
        id: 'station-core',
        type: 'circle',
        source: 'stations',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 5, 8, 9],
          'circle-color': ['get', 'color'],
          'circle-stroke-color': 'rgba(6,10,18,0.9)',
          'circle-stroke-width': 1.5,
        },
      } as maplibregl.LayerSpecification);

      map.addLayer({
        id: 'station-selected',
        type: 'circle',
        source: 'stations',
        filter: ['==', ['get', 'stationId'], ''],
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 11, 8, 16],
          'circle-color': 'rgba(0,0,0,0)',
          'circle-stroke-color': '#eaf0fb',
          'circle-stroke-width': 1.6,
        },
      } as maplibregl.LayerSpecification);

      map.addLayer({
        id: 'station-label',
        type: 'symbol',
        source: 'stations',
        filter: ['!', ['has', 'point_count']],
        minzoom: 5,
        layout: {
          'text-field': ['get', 'label'],
          'text-size': 10,
          'text-font': MAP_TEXT_FONT,
          'text-offset': [0, 1.5],
          'text-optional': true,
        },
        paint: {
          'text-color': '#eaf0fb',
          'text-halo-color': 'rgba(6,10,18,0.9)',
          'text-halo-width': 1.2,
        },
      } as maplibregl.LayerSpecification);

      const popup = popupRef.current;

      map.on('mouseenter', 'station-core', (event) => {
        map.getCanvas().style.cursor = 'pointer';
        const feature = event.features?.[0];
        const stationId = feature?.properties?.stationId;
        const station = stationsRef.current.find((s) => s.id === stationId);
        if (!station) return;
        popup
          ?.setLngLat([station.lon, station.lat])
          .setHTML(stationPopupHtml(station))
          .addTo(map);
      });

      map.on('mouseleave', 'station-core', () => {
        map.getCanvas().style.cursor = '';
        popup?.remove();
      });

      map.on('click', 'station-core', (event) => {
        const stationId = event.features?.[0]?.properties?.stationId;
        const station = stationsRef.current.find((s) => s.id === stationId);
        if (station) onSelectStation(station);
      });

      map.on('mouseenter', 'clusters', (event) => {
        map.getCanvas().style.cursor = 'pointer';
        const feature = event.features?.[0];
        if (!feature) return;
        popup
          ?.setLngLat(event.lngLat)
          .setHTML(clusterPopupHtml(feature.properties || {}))
          .addTo(map);
      });

      map.on('mouseleave', 'clusters', () => {
        map.getCanvas().style.cursor = '';
        popup?.remove();
      });

      map.on('click', 'clusters', (event) => {
        const feature = event.features?.[0];
        const clusterId = feature?.properties?.cluster_id;
        const source = map.getSource('stations') as GeoJSONSource;
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
        source
          .getClusterExpansionZoom(clusterId)
          .then((zoom) => {
            if (typeof zoom !== 'number') return;
            map.easeTo({ center, zoom });
          })
          .catch(() => undefined);
      });

      map.on('moveend', () => {
        onBoundsChange(getMapBoundsString(map));
      });

      map.addControl(
        new maplibregl.NavigationControl({ showCompass: false }),
        'bottom-right'
      );
      map.addControl(
        new maplibregl.ScaleControl({ maxWidth: 90, unit: 'metric' }),
        'bottom-left'
      );

      applyMode(map, modeRef.current);
      setMapStatus('ready');
      onMapLoadEnd();
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  /* The container can still be mid-layout when the map instantiates, so
     re-measure once ready (and on viewport changes as a safety net). */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || mapStatus !== 'ready') return undefined;

    const frame = window.requestAnimationFrame(() => map.resize());
    const handleResize = () => map.resize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', handleResize);
    };
  }, [mapStatus]);

  /* Push station data into both sources. */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || mapStatus !== 'ready') return;
    (map.getSource('stations') as GeoJSONSource | undefined)?.setData(geojson);
    (map.getSource('stations-raw') as GeoJSONSource | undefined)?.setData(
      geojson
    );
  }, [geojson, mapStatus]);

  /* Selection ring. */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || mapStatus !== 'ready') return;
    map.setFilter('station-selected', [
      '==',
      ['get', 'stationId'],
      selectedStationId || '',
    ]);
  }, [selectedStationId, mapStatus]);

  /* Fly-to requests. */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || mapStatus !== 'ready' || !focusTarget) return;
    map.easeTo({
      center: [focusTarget.lon, focusTarget.lat],
      zoom: focusTarget.zoom,
      duration: 900,
    });
  }, [focusTarget, mapStatus]);

  /* Mode toggle. */
  useEffect(() => {
    modeRef.current = mode;
    const map = mapRef.current;
    if (!map || mapStatus !== 'ready') return;
    applyMode(map, mode);
  }, [mode, mapStatus, applyMode]);

  const fallbackMessage =
    mapStatus === 'unsupported'
      ? 'This browser or device does not support the WebGL map. Live AQI station data is still available in the station list and insights.'
      : 'The map could not be initialized. Live AQI station data is still available in the station list and insights.';

  return (
    <>
      {(mapStatus === 'unsupported' || mapStatus === 'error') && (
        <div className="map-fallback">
          <div>
            <h2>Map unavailable</h2>
            <p>{fallbackMessage}</p>
          </div>
        </div>
      )}

      {mapStatus !== 'unsupported' && mapStatus !== 'error' && (
        <div ref={containerRef} className="map-canvas map-area" />
      )}

      <div className="map-vignette" aria-hidden="true" />

      <div className="map-dock">
        <Legend />
        <div className="seg glass" role="group" aria-label="Map mode">
          <button
            type="button"
            data-active={mode === 'stations'}
            onClick={() => setMode('stations')}
          >
            Stations
          </button>
          <button
            type="button"
            data-active={mode === 'field'}
            onClick={() => setMode('field')}
          >
            Pollution field
          </button>
        </div>
      </div>
    </>
  );
};

export default MapView;
