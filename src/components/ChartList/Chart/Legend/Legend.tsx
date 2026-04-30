/**
 * @file Legend.tsx
 * @desc Renders the AQI legend overlay in the bottom-left corner (or shifted if sidebar is open).
 */
import React from 'react';
import { Box, Typography, useMediaQuery } from '@mui/material';
import { AQI_CATEGORIES } from '../../../../aqi';

interface LegendProps {
  showSidebar: boolean;
}

/**
 * @function Legend
 * @desc Displays the colored AQI categories on the map.
 */
const Legend: React.FC<LegendProps> = ({ showSidebar }) => {
  const isCompact = useMediaQuery('(max-width:700px)');

  if (isCompact) {
    return (
      <Box
        sx={{
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 174,
          backgroundColor: 'rgba(255,255,255,0.88)',
          padding: '6px 8px',
          borderRadius: 1.5,
          zIndex: 1,
          display: 'grid',
          gap: 0.75,
          boxShadow: '0 8px 22px rgba(15, 23, 42, 0.12)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 800 }}>
          AQI scale
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)' }}>
          {AQI_CATEGORIES.map((category) => (
            <Box
              key={category.key}
              aria-label={`${category.range} ${category.label}`}
              title={`${category.range} ${category.label}`}
              sx={{
                height: 10,
                backgroundColor: category.color,
                '&:first-of-type': {
                  borderTopLeftRadius: 4,
                  borderBottomLeftRadius: 4,
                },
                '&:last-of-type': {
                  borderTopRightRadius: 4,
                  borderBottomRightRadius: 4,
                },
              }}
            />
          ))}
        </Box>
      </Box>
    );
  }

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
