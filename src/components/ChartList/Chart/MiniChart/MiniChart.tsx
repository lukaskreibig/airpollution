import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Box, IconButton } from '@mui/material';
import Plot from 'react-plotly.js';
import { Layout } from 'plotly.js';
import { ArrowUpOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { aqiColor } from '../chartUtilsHelpers/chartUtilsHelpers';

interface MiniChartProps {
  miniChartData: { aqi: number }[];
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
  /* ---------------------------------------------------------------------- */
  /*                              Grundwerte                                 */
  /* ---------------------------------------------------------------------- */
  const avg = miniChartData[0]?.aqi ?? 0;
  const [displayValue, setDisplayValue] = useState(avg);
  const animRef = useRef<number>();

  /* ---------------------------------------------------------------------- */
  /*                              Tween-Effect                               */
  /* ---------------------------------------------------------------------- */
  useEffect((): (() => void) => {
    if (avg === displayValue) return () => {};

    const start = displayValue;
    const end = avg;
    const duration = 600;
    let startTime: number | null = null;

    const animate = (t: number) => {
      if (startTime === null) startTime = t;
      const progress = Math.min((t - startTime) / duration, 1);
      setDisplayValue(start + (end - start) * progress);
      if (progress < 1) animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [avg, displayValue]);

  /* ---------------------------------------------------------------------- */
  /*                          Plotly-Layout (type-safe)                      */
  /* ---------------------------------------------------------------------- */
  const plotLayout: Partial<Layout> = useMemo(() => {
    const base: Partial<Layout> = {
      ...miniChartLayout,
      margin: { l: 20, r: 20, t: 40, b: 20 },
    };

    // Titel muss Objekt sein, kein String – sonst konfligieren die Typen
    if (typeof base.title === 'string') {
      base.title = { text: base.title };
    }

    return base;
  }, [miniChartLayout]);

  /* ---------------------------------------------------------------------- */
  /*                       Farbstufen für das Gauge                          */
  /* ---------------------------------------------------------------------- */
  const steps = [
    { range: [0, 50], color: '#009966' },
    { range: [50, 100], color: '#ffde33' },
    { range: [100, 150], color: '#ff9933' },
    { range: [150, 200], color: '#cc0033' },
    { range: [200, 300], color: '#660099' },
    { range: [300, 500], color: '#7e0023' },
  ];

  /* ---------------------------------------------------------------------- */
  /*                                   UI                                    */
  /* ---------------------------------------------------------------------- */
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
        p: miniChartExpanded ? 1 : 0,
        zIndex: 1200,
        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
        transition: 'width 0.3s, height 0.3s',
      }}
    >
      {/* Toggle-Button */}
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

      {/* Plot */}
      {miniChartExpanded && miniChartData.length > 0 && (
        <Plot
          data={[
            {
              type: 'indicator',
              mode: 'gauge+number',
              value: displayValue,
              title: { text: 'The average value of all points on the map view.', font: { size: 11 } },
              number: { font: { color: aqiColor(displayValue), size: 28 } },
              gauge: {
                axis: { range: [0, 500], tickwidth: 1 },
                steps,
                threshold: {
                  line: { color: aqiColor(displayValue), width: 4 },
                  value: displayValue,
                },
              },
            },
          ]}
          /* ------------------------------------------------------------------
            Cast auf any, da die Plotly-Typen aus react-plotly.js (_PlotParams_)
            derzeit aus einem anderen @types-Paket stammen als unsere direkte
            Layout-Definition – der Cast umgeht nur die Typ-Diskrepanz,
            ändert aber nichts an der Laufzeit-Sicherheit.
          ------------------------------------------------------------------ */
          layout={plotLayout as any}
          style={{ width: '100%', height: '100%' }}
          config={{ displayModeBar: false }}
        />
      )}
    </Box>
  );
};

export default MiniChart;
