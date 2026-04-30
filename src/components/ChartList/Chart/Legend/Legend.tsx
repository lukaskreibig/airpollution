/**
 * @file Legend.tsx
 * @desc Renders the AQI legend overlay in the bottom-left corner (or shifted if sidebar is open).
 */
import React from 'react';
import { Box, Typography } from '@mui/material';
import { AQI_CATEGORIES } from '../../../../aqi';

interface LegendProps {
  showSidebar: boolean;
}

/**
 * @function Legend
 * @desc Displays the colored AQI categories on the map.
 */
const Legend: React.FC<LegendProps> = ({ showSidebar }) => {
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
        AQI Legend
      </Typography>
      {AQI_CATEGORIES.map((category) => (
        <Box key={category.key} sx={{ display: 'flex', alignItems: 'center' }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              mr: 1,
              background: category.color,
            }}
          />
          <Typography variant="body2">
            {category.range} ({category.label})
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export default Legend;
