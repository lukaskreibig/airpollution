import React from 'react';
import { LatestResult } from '../../react-app-env';
import { Box, Typography } from '@mui/material';
import { aqiColor } from '../ChartList/Chart/chartUtilsHelpers/chartUtilsHelpers';

interface SidebarProps {
  points: LatestResult[];
}

const Sidebar: React.FC<SidebarProps> = ({ points }) => {
  return (
    <Box
      sx={{
        width: '300px',
        overflowY: 'auto',
        padding: '10px',
        borderRight: '1px solid #ccc',
      }}
    >
      <Typography variant="h6" gutterBottom>
        Stations
      </Typography>
      {points.map((point) => {
        const aqiNum = Number(point.aqi); // convert string to number
        return (
          <Box
            key={point.uid}
            sx={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}
          >
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: aqiColor(aqiNum),
                marginRight: '8px',
              }}
            />
            <Box>
              <Typography variant="body2">{point.station.name}</Typography>
              <Typography variant="caption">AQI: {point.aqi}</Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export default Sidebar;
