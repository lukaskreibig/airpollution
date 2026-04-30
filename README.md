# Map The Air

Interactive live Air Quality Index (AQI) map and insights dashboard built with React, Vite, MapLibre, Material UI, and WAQI/AQICN station data.

Live site: https://www.maptheair.com/

## Features

- Sharp vector basemap with MapLibre. MapTiler Cloud is used when `VITE_MAPTILER_API_KEY` is configured; OpenFreeMap vector tiles are used as the no-key fallback.
- Live WAQI/AQICN station AQI values through the `/api/waqi` Vercel serverless proxy.
- AQI category colors, health messaging, clustering, station popups, search, and sorting.
- Insights dashboard with station count, average AQI, worst AQI, category distribution, top polluted stations, cleanest monitored stations, and a searchable station table.
- Last-good-data behavior when refreshes fail.

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
VITE_MAPTILER_STYLE_ID=dataviz-light
VITE_WAQI_API_BASE_URL=
```

`VITE_MAPTILER_API_KEY` is optional for local development because the app falls back to OpenFreeMap. Configure it in Vercel for the intended production basemap.

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
- No-key vector fallback: OpenFreeMap
