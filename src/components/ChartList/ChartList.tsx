import React from 'react';
import { AirQualityStation } from '../../aqi';
import { MapFocusTarget } from '../../mapFocus';
import { ViewMode } from '../../viewMode';
import Chart from './Chart/Chart';

type Props = {
  locations: AirQualityStation[];
  viewMode: ViewMode;
  showSidebar: boolean;
  setShowSidebar: React.Dispatch<React.SetStateAction<boolean>>;
  focusTarget?: MapFocusTarget | null;
  onMapLoadEnd?: () => void;
  onMapBoundsChange?: (bounds: string) => void;
};

const ChartList: React.FC<Props> = ({
  locations,
  viewMode,
  showSidebar,
  setShowSidebar,
  focusTarget,
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
    <div
      style={{
        width: '100%',
        height: '100%',
        minHeight: 0,
        flex: 1,
        overflow: 'hidden',
      }}
    >
      <Chart
        locations={locations}
        viewMode={viewMode}
        showSidebar={showSidebar}
        setShowSidebar={setShowSidebar}
        focusTarget={focusTarget}
        onMapLoadEnd={onMapLoadEnd}
        onMapBoundsChange={onMapBoundsChange}
      />
    </div>
  );
};

export default ChartList;
