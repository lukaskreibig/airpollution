import React from 'react';
import Chart from './Chart/Chart';
import Sidebar from '../Sidebar/Sidebar';

interface ChartListProps {
  waqiData?: Array<any>;
  locations?: Array<any>;
  chart?: string;
  country?: string;
  countriesList?: Array<any>;
  showSidebar?: boolean;
  setShowSidebar?: React.Dispatch<React.SetStateAction<boolean>>;
  onDataChange?: (data: any[]) => void;
  onMapMoveEnd?: (bbox: string) => void;
}

function ChartList({
  waqiData,
  locations,
  onDataChange,
  onMapMoveEnd,
}: ChartListProps) {
  const data = waqiData || locations || [];
  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <Sidebar points={data} />
      <div style={{ flexGrow: 1 }}>
        <Chart
          waqiData={data}
          onDataChange={onDataChange}
          onMapMoveEnd={onMapMoveEnd}
        />
      </div>
    </div>
  );
}

export default ChartList;
