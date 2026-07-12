# Map The Air

A live **air quality observatory**: thousands of real-time AQI stations rendered on a cinematic dark world map, with an analytical insights view built from custom SVG charts. React + Vite + MapLibre, no UI framework — every component is hand-built.

Live site: https://www.maptheair.com/

## Features

**Map view**

- Cinematic dark vector basemap (MapTiler `dataviz-dark` with an API key, CARTO Dark Matter as the no-key fallback).
- Stations rendered as glowing, AQI-colored markers with value labels; clusters are colored by their *mean* AQI and expand on click.
- **Pollution field** mode: an AQI-weighted heatmap that shows pollution as a continuous glowing field.
- Click any station for a detail panel with pollutant-level AQI bars (the dominant pollutant is flagged) and a min–max **forecast band chart** per pollutant.
- Station rail with search, sorting (worst / cleanest / A–Z) and fly-to on click; becomes a bottom sheet on mobile.
- Live bounds-based refresh: panning the map re-queries WAQI for the visible area.

**Insights view**

- Animated median-AQI gauge and a narrative headline summarizing the loaded area.
- **AQI spectrum** histogram (square-root scaled, median/P90 markers).
- Health-category breakdown with a stacked distribution bar.
- Pollution hotspots and cleanest-air leaderboards — click through to the station spotlight or jump back to the map.
- Station spotlight with pollutant drivers, forecast band chart and source attributions.
- Data-freshness footer (fresh / stale / unknown readings).

**Design system**

- Dark "night observatory" theme, defined entirely in [`src/theme.css`](src/theme.css) with CSS custom properties.
- Typography: Bricolage Grotesque (display) + IBM Plex Mono (data readouts).
- All charts are dependency-free inline SVG.

## What Is AQI?

AQI is a public health scale for communicating air pollution. Map The Air uses the live AQI value reported by WAQI/AQICN stations. When pollutant concentration data is used for fallback/reference logic, it is treated as an estimated AQI because true AQI calculations can depend on pollutant-specific averaging windows and source methodology.

## Configuration

Server-only environment variable:

```bash
WAQI_TOKEN=
```

Frontend environment variables:

```bash
VITE_MAPTILER_API_KEY=
VITE_MAPTILER_STYLE_ID=dataviz-dark
VITE_WAQI_API_BASE_URL=
```

`VITE_MAPTILER_API_KEY` is optional for local development because the app falls back to CARTO Dark Matter. Configure it in Vercel for the intended production basemap.

Tip for frontend-only local development: point `VITE_WAQI_API_BASE_URL` at the deployed proxy (e.g. `https://www.maptheair.com/api/waqi`) in `.env.local` and skip `vercel dev`.

## Development

```bash
yarn install
yarn start
```

For local API functions, use Vercel dev:

```bash
vercel dev
```

Quality checks:

```bash
yarn typecheck
yarn lint
yarn test
yarn test:e2e
yarn build
```

## Deployment

Vercel builds the Vite app into `dist` and serves `/api/waqi` as a serverless function. Build output is intentionally not committed.

## Data Sources

- AQI data: WAQI/AQICN
- Primary vector map style: MapTiler Cloud
- No-key vector fallback: CARTO Dark Matter
