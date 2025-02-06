/**
 * MiniChart.tsx
 * We color the numeric text + skip re-animate if same value
 */
import React, { useState, useEffect, useRef } from 'react';
import { Box, IconButton } from '@mui/material';
import Plot from 'react-plotly.js';
import { Layout } from 'plotly.js';
import { ArrowUpOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { aqiColor } from '../chartUtilsHelpers/chartUtilsHelpers';

interface MiniChartProps {
  miniChartData: Array<{ aqi: number }>;
  miniChartLayout: Partial<Layout>;
  miniChartExpanded: boolean;
  toggleMiniChart: () => void;
}

const MiniChart: React.FC<MiniChartProps> = ({
  miniChartData,
  miniChartLayout,
  miniChartExpanded,
  toggleMiniChart,
}) => {
  // If we have 1 item => avg
  const avg = miniChartData.length ? miniChartData[0].aqi : 0;

  const [displayValue, setDisplayValue] = useState(avg);
  const animRef = useRef<number | null>(null);
  const lastValueRef = useRef<number>(avg);

  useEffect(() => {
    // If the new avg is the same as old => skip animation
    if (avg === lastValueRef.current) {
      setDisplayValue(avg);
      return;
    }
    lastValueRef.current = avg;

    // Animate from displayValue => new avg
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
    }
    const start = displayValue;
    const end = avg;
    const duration = 600;
    let startTime: number | null = null;

    const animate = (t: number) => {
      if (!startTime) startTime = t;
      const progress = Math.min((t - startTime) / duration, 1);
      const val = start + (end - start) * progress;
      setDisplayValue(val);
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [avg, displayValue]);

  // Build gauge color steps
  const gaugeSteps = [
    { range: [0, 50], color: '#009966' },
    { range: [50, 100], color: '#ffde33' },
    { range: [100, 150], color: '#ff9933' },
    { range: [150, 200], color: '#cc0033' },
    { range: [200, 300], color: '#660099' },
    { range: [300, 500], color: '#7e0023' },
  ];

  return (
    <Box
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
            data={[
              {
                type: 'indicator',
                mode: 'gauge+number',
                value: displayValue,
                title: { text: 'Average AQI', font: { size: 16 } },
                number: {
                  font: {
                    // color the numeric readout
                    color: aqiColor(displayValue),
                    size: 28,
                  },
                },
                gauge: {
                  axis: { range: [0, 500], tickwidth: 1 },
                  steps: gaugeSteps,
                  threshold: {
                    line: { color: aqiColor(displayValue), width: 4 },
                    value: displayValue,
                  },
                },
              },
            ]}
            layout={{
              ...miniChartLayout,
              margin: { l: 20, r: 20, t: 40, b: 20 },
            }}
            style={{ width: '100%', height: '100%' }}
            config={{ displayModeBar: false }}
          />
        </Box>
      )}
    </Box>
  );
};

export default MiniChart;
