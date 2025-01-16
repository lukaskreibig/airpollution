/**
 * @file Legend.tsx
 * @desc Renders the AQI legend overlay in the bottom-left corner (or shifted if sidebar is open).
 */
import React from 'react';
import { Box, Typography } from '@mui/material';

interface LegendProps {
  showSidebar: boolean;
  chart: string;
}

/**
 * @function Legend
 * @desc Displays the colored AQI categories on the map.
 */
const Legend: React.FC<LegendProps> = ({ showSidebar, chart }) => {
  if (chart !== '2') return null;

  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: 22,
        left: showSidebar ? 310 : 10,
        backgroundColor: 'rgba(255,255,255,0.8)',
        padding: '5px 10px',
        borderRadius: '4px',
        borderBottomLeftRadius: '0px',
        fontSize: '14px',
        fontFamily: 'sans-serif',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        transition: 'left 0.3s ease-in-out',
      }}
    >
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
        AQI-Legend
      </Typography>
      {/* Good */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box
          sx={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            mr: 1,
            background: '#2a9d8f',
          }}
        />
        <Typography variant="body2">0-50 (Good)</Typography>
      </Box>
      {/* Moderate */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box
          sx={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            mr: 1,
            background: '#e9c46a',
          }}
        />
        <Typography variant="body2">51-100 (Moderate)</Typography>
      </Box>
      {/* Unhealthy */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box
          sx={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            mr: 1,
            background: '#f4a261',
          }}
        />
        <Typography variant="body2">101-150 (Unhealthy)</Typography>
      </Box>
      {/* Very Unhealthy */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box
          sx={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            mr: 1,
            background: '#d62828',
          }}
        />
        <Typography variant="body2">151-200 (Very Unhealthy)</Typography>
      </Box>
      {/* Hazardous */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box
          sx={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            mr: 1,
            background: '#9d0208',
          }}
        />
        <Typography variant="body2">201+ (Hazardous)</Typography>
      </Box>
    </Box>
  );
};

export default Legend;
