import React from 'react';
import { AQI_CATEGORIES } from '../../aqi';

/** Horizontal AQI spectrum strip shown in the map dock. */
const Legend: React.FC = () => (
  <div className="legend-strip glass" aria-label="AQI color scale">
    <span className="legend-title">AQI</span>
    {AQI_CATEGORIES.map((category) => (
      <div
        key={category.key}
        className="legend-cell"
        style={{ '--cell-color': category.color } as React.CSSProperties}
        title={`${category.label} (${category.range})`}
      >
        <i />
        <span>{category.range}</span>
      </div>
    ))}
  </div>
);

export default Legend;
