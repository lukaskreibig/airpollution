import React from 'react';
import { AirQualityStation, getAqiCategory } from '../../aqi';

interface HistogramProps {
  stations: AirQualityStation[];
  medianAqi: number | null;
  p90Aqi: number | null;
}

const WIDTH = 680;
const HEIGHT = 200;
const PAD_X = 8;
const PAD_TOP = 18;
const PAD_BOTTOM = 26;
const BIN_SIZE = 25;
const BIN_COUNT = 12; // 0–300 in 25s
const SCALE_MAX = BIN_COUNT * BIN_SIZE;

interface Bin {
  from: number;
  to: number | null; // null = open-ended overflow bin
  count: number;
  color: string;
}

export function buildBins(stations: AirQualityStation[]): Bin[] {
  const bins: Bin[] = Array.from({ length: BIN_COUNT }, (_, index) => ({
    from: index * BIN_SIZE,
    to: (index + 1) * BIN_SIZE,
    count: 0,
    color: getAqiCategory(index * BIN_SIZE + BIN_SIZE / 2).color,
  }));
  const overflow: Bin = {
    from: SCALE_MAX,
    to: null,
    count: 0,
    color: getAqiCategory(SCALE_MAX + 1).color,
  };

  stations.forEach((station) => {
    if (station.aqi >= SCALE_MAX) {
      overflow.count += 1;
      return;
    }
    bins[Math.floor(station.aqi / BIN_SIZE)].count += 1;
  });

  return [...bins, overflow];
}

/**
 * Distribution of live AQI readings across the health scale.
 * Bar height uses a square-root scale so small-but-important tails
 * (unhealthy readings) stay visible next to dominant bins.
 */
const Histogram: React.FC<HistogramProps> = ({
  stations,
  medianAqi,
  p90Aqi,
}) => {
  const bins = buildBins(stations);
  const maxCount = Math.max(...bins.map((bin) => bin.count), 1);
  const innerWidth = WIDTH - PAD_X * 2;
  const innerHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const barGap = 5;
  const barWidth = innerWidth / bins.length - barGap;

  const barHeight = (count: number) =>
    count === 0 ? 0 : Math.max(Math.sqrt(count / maxCount) * innerHeight, 3);

  const xForValue = (value: number) =>
    PAD_X +
    (Math.min(value, SCALE_MAX) / SCALE_MAX) *
      (innerWidth - barWidth - barGap) +
    barWidth / 2;

  const markers = [
    { value: medianAqi, label: 'median' },
    { value: p90Aqi, label: 'p90' },
  ].filter(
    (marker): marker is { value: number; label: string } =>
      typeof marker.value === 'number'
  );

  return (
    <div className="histo">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="Distribution of AQI readings"
      >
        {bins.map((bin, index) => {
          const height = barHeight(bin.count);
          const x = PAD_X + index * (barWidth + barGap);
          const y = PAD_TOP + innerHeight - height;
          return (
            <g key={bin.from} className="histo-bar">
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(height, 0)}
                rx={4}
                fill={bin.color}
                fillOpacity={bin.count ? 0.85 : 0.12}
              >
                <title>
                  {bin.to === null
                    ? `AQI ${bin.from}+: ${bin.count} stations`
                    : `AQI ${bin.from}–${bin.to}: ${bin.count} stations`}
                </title>
              </rect>
              {bin.count > 0 && height > 16 && (
                <text
                  x={x + barWidth / 2}
                  y={y - 5}
                  textAnchor="middle"
                  fontSize={9}
                  fontFamily="var(--font-mono)"
                  fill="rgba(151,163,189,0.75)"
                >
                  {bin.count}
                </text>
              )}
              {(index % 2 === 0 || bin.to === null) && (
                <text
                  x={x + barWidth / 2}
                  y={HEIGHT - 8}
                  textAnchor="middle"
                  fontSize={8.5}
                  fontFamily="var(--font-mono)"
                  fill="rgba(95,108,136,0.9)"
                >
                  {bin.to === null ? `${bin.from}+` : bin.from}
                </text>
              )}
            </g>
          );
        })}

        {markers.map((marker) => {
          const x = xForValue(marker.value);
          return (
            <g key={marker.label}>
              <line
                x1={x}
                x2={x}
                y1={PAD_TOP - 4}
                y2={PAD_TOP + innerHeight}
                stroke="rgba(234,240,251,0.65)"
                strokeWidth={1}
                strokeDasharray="2 4"
              />
              <text
                x={x}
                y={PAD_TOP - 8}
                textAnchor="middle"
                fontSize={8.5}
                fontFamily="var(--font-mono)"
                fill="rgba(234,240,251,0.75)"
              >
                {marker.label} {marker.value}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default Histogram;
