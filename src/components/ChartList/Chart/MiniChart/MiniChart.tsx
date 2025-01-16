/**
 * @file MiniChart.tsx
 * @desc Overlay for the mini average chart in the bottom-right corner when chart=2.
 */
import React from 'react';
import { Box, IconButton } from '@mui/material';
import Plot from 'react-plotly.js';
import { ArrowUpOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { PlotData, Layout } from 'plotly.js';

interface MiniChartProps {
  miniChartData: Partial<PlotData>[];
  miniChartLayout: Partial<Layout>;
  miniChartExpanded: boolean;
  toggleMiniChart: () => void;
}

/**
 * @function MiniChart
 * @desc Shows a small bar chart overlay for average AQI when chart=2.
 */
const MiniChart: React.FC<MiniChartProps> = ({
  miniChartData,
  miniChartLayout,
  miniChartExpanded,
  toggleMiniChart,
}) => {
  return (
    <Box
      className="average-plot"
      sx={{
        position: 'fixed',
        bottom: 70,
        right: 30,
        width: miniChartExpanded ? 280 : 50,
        height: miniChartExpanded ? 240 : 50,
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: 2,
        padding: miniChartExpanded ? '5px' : '0px',
        zIndex: 1200,
        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
        transition: 'width 0.3s, height 0.3s',
      }}
    >
      <IconButton
        size="small"
        onClick={toggleMiniChart}
        sx={{
          position: 'absolute',
          top: 2,
          right: 2,
          zIndex: 1300,
          border: '1px solid rgba(0,0,0,0.2)',
          backgroundColor: 'white',
          '&:hover': { backgroundColor: 'whitesmoke' },
        }}
      >
        {miniChartExpanded ? <CloseCircleOutlined /> : <ArrowUpOutlined />}
      </IconButton>

      {miniChartExpanded && miniChartData.length > 0 && (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(255,255,255,0.8)',
          }}
        >
          <Plot
            data={miniChartData}
            layout={miniChartLayout}
            style={{ width: '100%', height: '100%' }}
            config={{ displayModeBar: false }}
          />
        </Box>
      )}
    </Box>
  );
};

export default MiniChart;
