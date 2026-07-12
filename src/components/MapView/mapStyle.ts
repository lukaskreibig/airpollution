import type { ExpressionSpecification } from 'maplibre-gl';
import { AirQualityStation, AQI_CATEGORIES, formatAqi } from '../../aqi';

const MAPTILER_API_KEY = process.env.VITE_MAPTILER_API_KEY?.trim();
const MAPTILER_STYLE_ID =
  process.env.VITE_MAPTILER_STYLE_ID?.trim() || 'dataviz-dark';

/** No-key fallback: CARTO's free dark vector basemap. */
const CARTO_DARK_STYLE =
  'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

export const MAP_STYLE = MAPTILER_API_KEY
  ? `https://api.maptiler.com/maps/${encodeURIComponent(
      MAPTILER_STYLE_ID
    )}/style.json?key=${encodeURIComponent(MAPTILER_API_KEY)}`
  : CARTO_DARK_STYLE;

/** Glyph stacks differ per provider; pick one that exists on each server. */
export const MAP_TEXT_FONT = MAPTILER_API_KEY
  ? ['Noto Sans Bold']
  : ['Montserrat Bold'];

/** Step expression fragment mapping an AQI value to its category color. */
export function aqiStepColor(input: unknown): ExpressionSpecification {
  return [
    'step',
    input,
    AQI_CATEGORIES[0].color,
    51,
    AQI_CATEGORIES[1].color,
    101,
    AQI_CATEGORIES[2].color,
    151,
    AQI_CATEGORIES[3].color,
    201,
    AQI_CATEGORIES[4].color,
    301,
    AQI_CATEGORIES[5].color,
  ] as ExpressionSpecification;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function stationPopupHtml(station: AirQualityStation): string {
  return `
    <div class="stat-pop">
      <div class="stat-pop-name">${escapeHtml(station.name)}</div>
      <div class="stat-pop-row">
        <span class="stat-pop-aqi" style="color:${station.category.color};">${station.aqi}</span>
        <span class="stat-pop-cat" style="color:${station.category.color};">${escapeHtml(
          station.category.label
        )}<br/><span style="color:var(--text-dim);font-weight:400;">${escapeHtml(
          station.category.healthMessage
        )}</span></span>
      </div>
      ${
        station.updatedAt
          ? `<div class="stat-pop-meta">Updated ${escapeHtml(station.updatedAt)}</div>`
          : ''
      }
      <div class="stat-pop-hint">Click the station for pollutants &amp; forecast</div>
    </div>
  `;
}

export function clusterPopupHtml(properties: Record<string, unknown>): string {
  const stationCount = Number(properties.point_count || 0);
  const worstAqi = Number(properties.maxAQI || 0);
  const meanAqi = stationCount
    ? Math.round(Number(properties.sumAQI || 0) / stationCount)
    : 0;

  return `
    <div class="stat-pop">
      <div class="stat-pop-name">${stationCount} stations</div>
      <div class="stat-pop-meta">Mean AQI ${formatAqi(meanAqi)} &nbsp;·&nbsp; worst ${formatAqi(
        worstAqi
      )}</div>
      <div class="stat-pop-hint">Click to zoom in</div>
    </div>
  `;
}

export function buildGeoJSON(
  stations: AirQualityStation[]
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: 'FeatureCollection',
    features: stations.map((station) => ({
      type: 'Feature',
      id: station.id,
      geometry: {
        type: 'Point',
        coordinates: [station.lon, station.lat],
      },
      properties: {
        stationId: station.id,
        name: station.name,
        aqi: station.aqi,
        label: formatAqi(station.aqi),
        color: station.category.color,
      },
    })),
  };
}
