import React from 'react';
import { AQI_CATEGORIES, getAqiCategory } from '../../aqi';

interface GaugeProps {
  value: number | null;
  label: string;
}

const SIZE = 256;
const CENTER = SIZE / 2;
const RADIUS = 96;
const START_ANGLE = -120;
const END_ANGLE = 120;
const SCALE_MAX = 300;

function polar(angleDeg: number, radius: number): [number, number] {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [CENTER + radius * Math.cos(rad), CENTER + radius * Math.sin(rad)];
}

function arcPath(startAngle: number, endAngle: number, radius: number): string {
  const [sx, sy] = polar(startAngle, radius);
  const [ex, ey] = polar(endAngle, radius);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${radius} ${radius} 0 ${largeArc} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`;
}

const angleForValue = (value: number) =>
  START_ANGLE +
  (Math.min(Math.max(value, 0), SCALE_MAX) / SCALE_MAX) *
    (END_ANGLE - START_ANGLE);

/**
 * Semi-circular AQI gauge on a 0–300 scale. The track is segmented in the
 * six category colors; the needle dot marks the current value.
 */
const Gauge: React.FC<GaugeProps> = ({ value, label }) => {
  const category = getAqiCategory(value);
  const clamped = value === null ? 0 : Math.min(value, SCALE_MAX);
  const sweep = END_ANGLE - START_ANGLE;

  /* Category segments: 0-50-100-150-200-300 (+ hazardous edge). */
  const stops = [0, 50, 100, 150, 200, 300];
  const segments = AQI_CATEGORIES.slice(0, 5).map((cat, index) => ({
    color: cat.color,
    start: START_ANGLE + (stops[index] / SCALE_MAX) * sweep,
    end: START_ANGLE + (stops[index + 1] / SCALE_MAX) * sweep,
  }));

  const valueAngle = angleForValue(clamped);
  const [dotX, dotY] = polar(valueAngle, RADIUS);

  return (
    <div className="gauge" aria-label={`${label}: ${value ?? 'unknown'}`}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {/* Dim full track */}
        <path
          d={arcPath(START_ANGLE, END_ANGLE, RADIUS)}
          fill="none"
          stroke="rgba(148,163,197,0.14)"
          strokeWidth={12}
          strokeLinecap="round"
        />
        {/* Category segments */}
        {segments.map((segment) => (
          <path
            key={segment.color + segment.start}
            d={arcPath(segment.start + 1.2, segment.end - 1.2, RADIUS)}
            fill="none"
            stroke={segment.color}
            strokeOpacity={0.28}
            strokeWidth={12}
            strokeLinecap="butt"
          />
        ))}
        {/* Progress arc up to the value */}
        {value !== null && (
          <path
            d={arcPath(
              START_ANGLE,
              Math.max(valueAngle, START_ANGLE + 2),
              RADIUS
            )}
            fill="none"
            stroke={category.color}
            strokeWidth={12}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 10px ${category.color}90)`,
            }}
          />
        )}
        {/* Needle dot */}
        {value !== null && (
          <circle
            cx={dotX}
            cy={dotY}
            r={7}
            fill="#eaf0fb"
            stroke={category.color}
            strokeWidth={3}
          />
        )}
        {/* Scale labels */}
        {stops.map((stop) => {
          const [tx, ty] = polar(angleForValue(stop), RADIUS + 24);
          return (
            <text
              key={stop}
              x={tx}
              y={ty}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={9}
              fontFamily="var(--font-mono)"
              fill="rgba(95,108,136,0.9)"
            >
              {stop}
            </text>
          );
        })}
      </svg>
      <div className="gauge-center">
        <div className="gauge-num" style={{ color: category.color }}>
          {value ?? '–'}
        </div>
        <div className="gauge-label">{label}</div>
        <div className="gauge-cat" style={{ color: category.color }}>
          {value !== null ? category.label : 'No data'}
        </div>
      </div>
    </div>
  );
};

export default Gauge;
