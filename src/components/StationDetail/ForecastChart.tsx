import React from 'react';
import { WaqiForecastDay, getAqiCategory } from '../../aqi';

interface ForecastChartProps {
  days: WaqiForecastDay[];
  label: string;
}

const WIDTH = 340;
const HEIGHT = 150;
const PAD_X = 10;
const PAD_TOP = 12;
const PAD_BOTTOM = 26;

function shortDay(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value.slice(5);
  return date.toLocaleDateString(undefined, { weekday: 'short' });
}

/**
 * Min–max band with an average line for one pollutant's daily AQI forecast.
 */
const ForecastChart: React.FC<ForecastChartProps> = ({ days, label }) => {
  const points = days
    .filter((day) => day.avg !== null || day.max !== null || day.min !== null)
    .slice(0, 8);

  if (points.length < 2) return null;

  const values = points.flatMap((day) =>
    [day.min, day.avg, day.max].filter((v): v is number => v !== null)
  );
  const yMax = Math.max(...values, 60) * 1.15;
  const innerWidth = WIDTH - PAD_X * 2;
  const innerHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const x = (index: number) =>
    PAD_X + (index / (points.length - 1)) * innerWidth;
  const y = (value: number) =>
    PAD_TOP + innerHeight - (Math.min(value, yMax) / yMax) * innerHeight;

  const resolve = (day: WaqiForecastDay) => day.avg ?? day.max ?? day.min ?? 0;

  const bandTop = points.map(
    (day, i) => `${x(i)},${y(day.max ?? resolve(day))}`
  );
  const bandBottom = [...points]
    .reverse()
    .map(
      (day, i) => `${x(points.length - 1 - i)},${y(day.min ?? resolve(day))}`
    );
  const avgLine = points.map((day, i) => `${x(i)},${y(resolve(day))}`);

  const gridLevels = [50, 100, 150, 200, 300].filter((level) => level < yMax);

  return (
    <div>
      <svg
        className="forecast-svg"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`${label} AQI forecast for the next ${points.length} days`}
      >
        {gridLevels.map((level) => (
          <g key={level}>
            <line
              x1={PAD_X}
              x2={WIDTH - PAD_X}
              y1={y(level)}
              y2={y(level)}
              stroke={getAqiCategory(level).color}
              strokeOpacity={0.18}
              strokeDasharray="3 5"
            />
            <text
              x={WIDTH - PAD_X}
              y={y(level) - 3}
              textAnchor="end"
              fontSize={8}
              fill="rgba(151,163,189,0.55)"
              fontFamily="var(--font-mono)"
            >
              {level}
            </text>
          </g>
        ))}

        <polygon
          points={[...bandTop, ...bandBottom].join(' ')}
          fill="rgba(125,211,252,0.13)"
          stroke="none"
        />
        <polyline
          points={avgLine.join(' ')}
          fill="none"
          stroke="rgba(125,211,252,0.9)"
          strokeWidth={1.8}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {points.map((day, i) => {
          const value = resolve(day);
          return (
            <g key={day.day}>
              <circle
                cx={x(i)}
                cy={y(value)}
                r={3.2}
                fill={day.category.color}
                stroke="rgba(6,10,18,0.9)"
                strokeWidth={1}
              >
                <title>
                  {`${day.day}: avg ${day.avg ?? '–'}, range ${day.min ?? '–'}–${day.max ?? '–'}`}
                </title>
              </circle>
              <text
                x={x(i)}
                y={HEIGHT - 8}
                textAnchor="middle"
                fontSize={8.5}
                fill="rgba(151,163,189,0.8)"
                fontFamily="var(--font-mono)"
              >
                {shortDay(day.day)}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="forecast-caption">
        {label} · shaded band = daily min–max, line = expected AQI
      </div>
    </div>
  );
};

export default ForecastChart;
