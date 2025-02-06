import React from 'react';
import { Box } from '@mui/material';
import ChartOrMap from './Chart/ChartOrMap';

interface ChartListProps {
  locations: any[];
  chart: string;
  showSidebar: boolean;
  setShowSidebar: React.Dispatch<React.SetStateAction<boolean>>;
  onMapIdle?: () => void;
  onMapBoundsChange?: (sw: [number, number], ne: [number, number]) => void;
}

const ChartList: React.FC<ChartListProps> = ({
  locations,
  chart,
  showSidebar,
  setShowSidebar,
  onMapIdle,
  onMapBoundsChange,
}) => {
  if (!locations.length) {
    return (
      <Box className="charts" id="message">
        No air quality data found for this region at this time.
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%', flex: 1 }}>
      <ChartOrMap
        locations={locations}
        chart={chart}
        showSidebar={showSidebar}
        setShowSidebar={setShowSidebar}
        onMapIdle={onMapIdle}
        onMapBoundsChange={onMapBoundsChange}
      />
    </Box>
  );
};

export default ChartList;
