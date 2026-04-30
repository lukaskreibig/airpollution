import React from 'react';
import { AirQualityStation } from '../../aqi';
import Chart from './Chart/Chart';

type Props = {
  locations: AirQualityStation[];
  chart: string;
  showSidebar: boolean;
  setShowSidebar: React.Dispatch<React.SetStateAction<boolean>>;
  onMapLoadEnd?: () => void;
  onMapBoundsChange?: (bounds: string) => void;
};

const ChartList: React.FC<Props> = ({
  locations,
  chart,
  showSidebar,
  setShowSidebar,
  onMapLoadEnd,
  onMapBoundsChange,
}) => {
  if (!locations.length) {
    return (
      <div className="charts" id="message">
        No live AQI stations found for the current map area.
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', flex: 1 }}>
      <Chart
        locations={locations}
        chart={chart}
        showSidebar={showSidebar}
        setShowSidebar={setShowSidebar}
        onMapLoadEnd={onMapLoadEnd}
        onMapBoundsChange={onMapBoundsChange}
      />
    </div>
  );
};

export default ChartList;
