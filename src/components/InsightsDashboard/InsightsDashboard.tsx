import React, { useMemo, useState } from 'react';
import {
  Box,
  Chip,
  Divider,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from '@mui/material';

import {
  AirQualityStation,
  AQI_CATEGORIES,
  AqiCategoryKey,
  aqiColor,
  formatAqi,
} from '../../aqi';
import { computeAqiInsights } from '../../insights';

interface InsightsDashboardProps {
  stations: AirQualityStation[];
}

interface MetricCardProps {
  label: string;
  value: string;
  helper: string;
  accent?: string;
}

type CategoryFilter = AqiCategoryKey | 'all';

function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

function MetricCard({ label, value, helper, accent }: MetricCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid rgba(17,24,39,0.1)',
        borderRadius: 2,
        p: 2,
        backgroundColor: '#ffffff',
        borderLeft: accent ? `5px solid ${accent}` : undefined,
      }}
    >
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
      <Typography variant="h4" sx={{ mt: 0.5, fontWeight: 800 }}>
        {value}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {helper}
      </Typography>
    </Paper>
  );
}

function StationRankList({
  maxAqi,
  stations,
  title,
}: {
  maxAqi: number;
  stations: AirQualityStation[];
  title: string;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid rgba(17,24,39,0.1)',
        borderRadius: 2,
        p: 2,
        minHeight: 0,
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
        {title}
      </Typography>
      <List dense disablePadding>
        {stations.map((station) => (
          <ListItem key={station.id} disableGutters sx={{ display: 'block' }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Typography
                variant="body2"
                sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}
              >
                {station.name}
              </Typography>
              <Chip
                size="small"
                label={formatAqi(station.aqi)}
                sx={{
                  borderRadius: 1,
                  backgroundColor: station.category.color,
                  color: station.category.foreground,
                  fontWeight: 800,
                }}
              />
            </Box>
            <LinearProgress
              variant="determinate"
              value={maxAqi ? Math.min((station.aqi / maxAqi) * 100, 100) : 0}
              sx={{
                mt: 0.75,
                mb: 1.25,
                height: 6,
                borderRadius: 1,
                backgroundColor: 'rgba(17,24,39,0.08)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: station.category.color,
                },
              }}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}

const InsightsDashboard: React.FC<InsightsDashboardProps> = ({ stations }) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const insights = useMemo(() => computeAqiInsights(stations), [stations]);
  const maxAqi = Math.max(...stations.map((station) => station.aqi), 1);
  const riskCategory = insights.worstStation?.category;
  const riskTitle = riskCategory
    ? `${riskCategory.label} conditions are present`
    : 'No live AQI stations loaded';
  const riskCopy = insights.worstStation
    ? `${insights.worstStation.name} is the highest loaded station at AQI ${insights.worstStation.aqi}. ${insights.unhealthyCount} of ${insights.stationCount} stations are unhealthy for sensitive groups or worse.`
    : 'Move the map or use your location to load stations for a specific area.';
  const filteredStations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const byCategory =
      activeCategory === 'all'
        ? stations
        : stations.filter((station) => station.category.key === activeCategory);
    const filtered = normalizedQuery
      ? byCategory.filter((station) =>
          station.name.toLowerCase().includes(normalizedQuery)
        )
      : byCategory;

    return [...filtered].sort((a, b) => b.aqi - a.aqi).slice(0, 50);
  }, [activeCategory, query, stations]);

  return (
    <Box
      className="insights-dashboard"
      sx={{
        width: '100%',
        minHeight: '100%',
        overflow: 'auto',
        backgroundColor: '#f7f8fa',
        px: { xs: 2, md: 4 },
        py: { xs: 8, md: 9 },
      }}
    >
      <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr auto' },
            gap: 2,
            alignItems: 'end',
            mb: 3,
          }}
        >
          <Box>
            <Typography variant="overline" sx={{ color: 'text.secondary' }}>
              Live AQI Overview
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              Air quality insights
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Latest update: {insights.latestUpdate || 'not available'}
          </Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{
            border: '1px solid rgba(17,24,39,0.1)',
            borderLeft: `6px solid ${riskCategory?.color || '#7a869a'}`,
            borderRadius: 2,
            p: { xs: 2, md: 2.5 },
            mb: 2,
            backgroundColor: '#ffffff',
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr auto' },
            gap: 2,
            alignItems: 'center',
          }}
        >
          <Box>
            <Typography variant="overline" sx={{ color: 'text.secondary' }}>
              Area health signal
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              {riskTitle}
            </Typography>
            <Typography
              variant="body2"
              sx={{ mt: 0.5, color: 'text.secondary' }}
            >
              {riskCopy}
            </Typography>
          </Box>
          <Chip
            label={
              riskCategory
                ? `Worst AQI ${formatAqi(insights.worstStation?.aqi)}`
                : 'No AQI'
            }
            sx={{
              justifySelf: { xs: 'start', md: 'end' },
              borderRadius: 1,
              px: 1,
              height: 38,
              fontSize: 16,
              fontWeight: 900,
              backgroundColor: riskCategory?.color || '#7a869a',
              color: riskCategory?.foreground || '#ffffff',
            }}
          />
        </Paper>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              lg: 'repeat(4, 1fr)',
            },
            gap: 2,
            mb: 2,
          }}
        >
          <MetricCard
            label="Unhealthy share"
            value={formatPercent(insights.unhealthyPercent)}
            helper={`${insights.unhealthyCount} of ${insights.stationCount} stations`}
            accent="#cc0033"
          />
          <MetricCard
            label="Dominant category"
            value={insights.dominantCategory?.shortLabel || 'n/a'}
            helper={`${insights.dominantCategory?.count || 0} loaded stations`}
            accent={insights.dominantCategory?.color}
          />
          <MetricCard
            label="Fresh data"
            value={formatPercent(insights.freshnessPercent)}
            helper={`${insights.staleCount} stale, ${insights.unknownFreshnessCount} unknown`}
            accent="#0f766e"
          />
          <MetricCard
            label="Average AQI"
            value={formatAqi(insights.averageAqi)}
            helper="Secondary context only"
            accent={aqiColor(insights.averageAqi)}
          />
        </Box>

        <Paper
          elevation={0}
          sx={{
            border: '1px solid rgba(17,24,39,0.1)',
            borderRadius: 2,
            p: 2,
            mb: 2,
            backgroundColor: '#ffffff',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
            Category distribution
          </Typography>
          <Box sx={{ display: 'grid', gap: 1.25 }}>
            {insights.categoryCounts.map((category) => (
              <Box
                key={category.key}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '210px 1fr 92px' },
                  gap: 1,
                  alignItems: 'center',
                }}
              >
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: category.color,
                    }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {category.shortLabel}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={category.percent}
                  sx={{
                    height: 9,
                    borderRadius: 1,
                    backgroundColor: 'rgba(17,24,39,0.08)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: category.color,
                    },
                  }}
                />
                <Typography variant="body2" sx={{ fontWeight: 800 }}>
                  {category.count} · {formatPercent(category.percent)}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
            gap: 2,
            mb: 2,
          }}
        >
          <StationRankList
            maxAqi={maxAqi}
            stations={insights.topStations}
            title="Highest AQI stations"
          />
          <StationRankList
            maxAqi={maxAqi}
            stations={insights.cleanestStations}
            title="Cleanest monitored stations"
          />
        </Box>

        <Paper
          elevation={0}
          sx={{
            border: '1px solid rgba(17,24,39,0.1)',
            borderRadius: 2,
            p: 2,
            backgroundColor: '#ffffff',
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 320px' },
              gap: 2,
              alignItems: 'center',
              mb: 1,
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Station table
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Showing the highest 50 matches sorted by AQI.
              </Typography>
            </Box>
            <TextField
              label="Search stations"
              size="small"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
            <Chip
              label={`All ${stations.length}`}
              clickable
              onClick={() => setActiveCategory('all')}
              color={activeCategory === 'all' ? 'primary' : 'default'}
              sx={{ borderRadius: 1, fontWeight: 800 }}
            />
            {AQI_CATEGORIES.map((category) => {
              const count =
                insights.categoryCounts.find(
                  (item) => item.key === category.key
                )?.count || 0;

              return (
                <Chip
                  key={category.key}
                  label={`${category.shortLabel} ${count}`}
                  clickable
                  onClick={() => setActiveCategory(category.key)}
                  variant={
                    activeCategory === category.key ? 'filled' : 'outlined'
                  }
                  sx={{
                    borderRadius: 1,
                    fontWeight: 800,
                    backgroundColor:
                      activeCategory === category.key
                        ? category.color
                        : 'transparent',
                    color:
                      activeCategory === category.key
                        ? category.foreground
                        : '#1f2933',
                    borderColor: category.color,
                  }}
                />
              );
            })}
          </Box>
          <Divider sx={{ mb: 1 }} />
          <List dense disablePadding>
            {filteredStations.map((station) => (
              <ListItem
                key={station.id}
                disableGutters
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr auto auto' },
                  gap: 1,
                  py: 1,
                }}
              >
                <ListItemText
                  primary={station.name}
                  secondary={station.updatedAt || 'Update time unavailable'}
                  primaryTypographyProps={{ fontWeight: 700 }}
                />
                <Chip
                  label={station.category.label}
                  size="small"
                  sx={{
                    justifySelf: { xs: 'start', sm: 'end' },
                    borderRadius: 1,
                    backgroundColor: `${station.category.color}24`,
                    color: '#1f2933',
                    fontWeight: 700,
                  }}
                />
                <Chip
                  label={formatAqi(station.aqi)}
                  size="small"
                  sx={{
                    justifySelf: { xs: 'start', sm: 'end' },
                    borderRadius: 1,
                    minWidth: 54,
                    backgroundColor: station.category.color,
                    color: station.category.foreground,
                    fontWeight: 900,
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Box>
    </Box>
  );
};

export default InsightsDashboard;
