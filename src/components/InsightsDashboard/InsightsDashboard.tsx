import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  ButtonBase,
  Chip,
  Divider,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';

import {
  AirQualityStation,
  AQI_CATEGORIES,
  AqiCategoryKey,
  WaqiForecastDay,
  WaqiStationDetail,
  formatAqi,
  normalizeWaqiStationDetail,
} from '../../aqi';
import { computeAqiInsights } from '../../insights';

interface InsightsDashboardProps {
  stations: AirQualityStation[];
}

type CategoryFilter = AqiCategoryKey | 'all';
type InsightTab =
  | 'overview'
  | 'hotspots'
  | 'pollutants'
  | 'forecast'
  | 'quality';

type DetailState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'loaded'; detail: WaqiStationDetail }
  | { status: 'error'; error: string };

const WAQI_BASE_URL = process.env.VITE_WAQI_API_BASE_URL || '/api/waqi';
const EXTREME_AQI_THRESHOLD = 500;

const tabLabels: Array<{ value: InsightTab; label: string }> = [
  { value: 'overview', label: 'Overview' },
  { value: 'hotspots', label: 'Hotspots' },
  { value: 'pollutants', label: 'Pollutants' },
  { value: 'forecast', label: 'Forecast' },
  { value: 'quality', label: 'Data quality' },
];

const surfaceSx = {
  border: '1px solid rgba(17,24,39,0.1)',
  borderRadius: 2,
  backgroundColor: '#ffffff',
};

function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

function formatDay(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function barPercent(value: number | null | undefined, max = 500): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.min(Math.max((value / max) * 100, 0), 100);
}

function selectedBorder(active: boolean, color: string): string {
  return active ? `2px solid ${color}` : '1px solid rgba(17,24,39,0.1)';
}

function MetricCard({
  accent,
  helper,
  label,
  value,
}: {
  accent: string;
  helper: string;
  label: string;
  value: string;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        ...surfaceSx,
        borderLeft: `5px solid ${accent}`,
        minHeight: 118,
        p: 2,
      }}
    >
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
      <Typography variant="h4" sx={{ mt: 0.5, fontWeight: 900 }}>
        {value}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {helper}
      </Typography>
    </Paper>
  );
}

function AqiChip({
  aqi,
  label,
}: {
  aqi: number | null | undefined;
  label?: string;
}) {
  const category = AQI_CATEGORIES.find((item) => item.key === label);
  const fallbackCategory =
    typeof aqi === 'number'
      ? AQI_CATEGORIES.find((item) => {
          if (aqi <= 50) return item.key === 'good';
          if (aqi <= 100) return item.key === 'moderate';
          if (aqi <= 150) return item.key === 'unhealthy-sensitive';
          if (aqi <= 200) return item.key === 'unhealthy';
          if (aqi <= 300) return item.key === 'very-unhealthy';
          return item.key === 'hazardous';
        })
      : undefined;
  const colorCategory = category || fallbackCategory || AQI_CATEGORIES[0];

  return (
    <Chip
      size="small"
      label={formatAqi(aqi)}
      sx={{
        borderRadius: 1,
        minWidth: 52,
        backgroundColor: colorCategory.color,
        color: colorCategory.foreground,
        fontWeight: 900,
      }}
    />
  );
}

function CategoryDistribution({
  activeCategory,
  categoryCounts,
  onSelectCategory,
}: {
  activeCategory: CategoryFilter;
  categoryCounts: ReturnType<typeof computeAqiInsights>['categoryCounts'];
  onSelectCategory: (category: CategoryFilter) => void;
}) {
  const hasStations = categoryCounts.some((category) => category.count > 0);

  return (
    <Paper elevation={0} sx={{ ...surfaceSx, p: { xs: 2, md: 2.5 } }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr auto' },
          gap: 1,
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            AQI health ladder
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Station counts by health category. AQI over 100 is where air quality
            becomes unhealthy for sensitive groups or worse.
          </Typography>
        </Box>
        <Chip
          label="Filter by category"
          size="small"
          sx={{ borderRadius: 1, justifySelf: { xs: 'start', md: 'end' } }}
        />
      </Box>

      <Box
        aria-label="AQI category distribution"
        sx={{
          display: 'flex',
          height: 16,
          overflow: 'hidden',
          borderRadius: 1,
          backgroundColor: 'rgba(17,24,39,0.08)',
          mb: 2,
        }}
      >
        {hasStations &&
          categoryCounts.map((category) => (
            <Box
              key={category.key}
              title={`${category.label}: ${category.count} stations`}
              sx={{
                width: `${category.percent}%`,
                minWidth: category.count ? 4 : 0,
                backgroundColor: category.color,
              }}
            />
          ))}
      </Box>

      <Box sx={{ display: 'grid', gap: 1 }}>
        {categoryCounts.map((category) => (
          <ButtonBase
            key={category.key}
            onClick={() =>
              onSelectCategory(
                activeCategory === category.key ? 'all' : category.key
              )
            }
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '190px 1fr 92px' },
              gap: 1,
              alignItems: 'center',
              width: '100%',
              borderRadius: 1,
              p: 0.75,
              textAlign: 'left',
              border: selectedBorder(
                activeCategory === category.key,
                category.color
              ),
              backgroundColor:
                activeCategory === category.key
                  ? `${category.color}12`
                  : 'transparent',
            }}
          >
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: category.color,
                  flex: '0 0 auto',
                }}
              />
              <Typography variant="body2" sx={{ fontWeight: 800 }}>
                {category.shortLabel}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={category.percent}
              sx={{
                height: 8,
                borderRadius: 1,
                backgroundColor: 'rgba(17,24,39,0.08)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: category.color,
                },
              }}
            />
            <Typography
              variant="body2"
              sx={{ fontWeight: 900, justifySelf: { xs: 'start', sm: 'end' } }}
            >
              {category.count} - {formatPercent(category.percent)}
            </Typography>
          </ButtonBase>
        ))}
      </Box>
    </Paper>
  );
}

function StationButton({
  active,
  maxAqi,
  onClick,
  station,
}: {
  active: boolean;
  maxAqi: number;
  onClick: () => void;
  station: AirQualityStation;
}) {
  const isExtreme = station.aqi > EXTREME_AQI_THRESHOLD;

  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        display: 'block',
        width: '100%',
        p: 1,
        borderRadius: 1,
        textAlign: 'left',
        border: selectedBorder(active, station.category.color),
        backgroundColor: active ? `${station.category.color}12` : '#ffffff',
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: 1,
          alignItems: 'start',
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 900 }}>
            {station.name}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {station.category.shortLabel}
            {isExtreme ? ' - extreme WAQI reading' : ''}
          </Typography>
        </Box>
        <AqiChip aqi={station.aqi} />
      </Box>
      <LinearProgress
        variant="determinate"
        value={barPercent(station.aqi, Math.max(maxAqi, 100))}
        sx={{
          mt: 1,
          height: 6,
          borderRadius: 1,
          backgroundColor: 'rgba(17,24,39,0.08)',
          '& .MuiLinearProgress-bar': {
            backgroundColor: station.category.color,
          },
        }}
      />
    </ButtonBase>
  );
}

function StationRankPanel({
  maxAqi,
  onSelectStation,
  selectedStationId,
  stations,
  title,
}: {
  maxAqi: number;
  onSelectStation: (station: AirQualityStation) => void;
  selectedStationId?: string;
  stations: AirQualityStation[];
  title: string;
}) {
  return (
    <Paper elevation={0} sx={{ ...surfaceSx, p: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>
        {title}
      </Typography>
      <Box sx={{ display: 'grid', gap: 1 }}>
        {stations.map((station) => (
          <StationButton
            key={station.id}
            active={station.id === selectedStationId}
            maxAqi={maxAqi}
            onClick={() => onSelectStation(station)}
            station={station}
          />
        ))}
      </Box>
    </Paper>
  );
}

function DetailShell({
  detailState,
  selectedStation,
}: {
  detailState?: DetailState;
  selectedStation?: AirQualityStation;
}) {
  if (!selectedStation) {
    return (
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        Select a station to load detailed WAQI data.
      </Typography>
    );
  }

  if (!selectedStation.providerId) {
    return (
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        Station detail data is not available for this loaded point.
      </Typography>
    );
  }

  if (
    !detailState ||
    detailState.status === 'idle' ||
    detailState.status === 'loading'
  ) {
    return (
      <Box>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
          Loading station detail from WAQI...
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  if (detailState.status === 'error') {
    return (
      <Typography variant="body2" sx={{ color: '#9f1239' }}>
        {detailState.error}
      </Typography>
    );
  }

  return null;
}

function PollutantPanel({
  detailState,
  selectedStation,
}: {
  detailState?: DetailState;
  selectedStation?: AirQualityStation;
}) {
  if (detailState?.status !== 'loaded') {
    return (
      <DetailShell
        detailState={detailState}
        selectedStation={selectedStation}
      />
    );
  }

  const { detail } = detailState;
  const maxPollutantAqi = Math.max(
    100,
    ...detail.pollutants.map((pollutant) => pollutant.value)
  );

  return (
    <Paper elevation={0} sx={{ ...surfaceSx, p: { xs: 2, md: 2.5 } }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr auto' },
          gap: 1,
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Pollutant drivers
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            WAQI reports individual pollutant AQIs. The overall station AQI is
            driven by the pollutant with the highest health concern.
          </Typography>
        </Box>
        <Chip
          label={
            detail.primaryPollutantLabel
              ? `Primary: ${detail.primaryPollutantLabel}`
              : 'Primary unknown'
          }
          sx={{
            borderRadius: 1,
            fontWeight: 900,
            justifySelf: { xs: 'start', md: 'end' },
          }}
        />
      </Box>

      {!detail.pollutants.length && (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          No pollutant-level AQI values are available for this station.
        </Typography>
      )}

      <Box sx={{ display: 'grid', gap: 1.25 }}>
        {detail.pollutants.map((pollutant) => (
          <Box key={pollutant.key}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: 1,
                alignItems: 'center',
                mb: 0.5,
              }}
            >
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 900 }}>
                  {pollutant.label}
                </Typography>
                {pollutant.isPrimary && (
                  <Chip label="driver" size="small" sx={{ borderRadius: 1 }} />
                )}
              </Box>
              <AqiChip aqi={pollutant.value} />
            </Box>
            <LinearProgress
              variant="determinate"
              value={barPercent(pollutant.value, maxPollutantAqi)}
              sx={{
                height: 10,
                borderRadius: 1,
                backgroundColor: 'rgba(17,24,39,0.08)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: pollutant.category.color,
                },
              }}
            />
          </Box>
        ))}
      </Box>

      <Divider sx={{ my: 2 }} />
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        Current station AQI: {formatAqi(detail.aqi)} ({detail.category.label}).
        {detail.updatedAt ? ` Updated ${detail.updatedAt}.` : ''}
      </Typography>
    </Paper>
  );
}

function ForecastPanel({
  detailState,
  selectedStation,
}: {
  detailState?: DetailState;
  selectedStation?: AirQualityStation;
}) {
  const forecastGroups = useMemo(() => {
    if (detailState?.status !== 'loaded') return [];
    const groups = new Map<string, WaqiForecastDay[]>();

    detailState.detail.forecast.forEach((day) => {
      const current = groups.get(day.pollutant) || [];
      current.push(day);
      groups.set(day.pollutant, current);
    });

    return Array.from(groups.entries())
      .map(([pollutant, days]) => ({
        pollutant,
        label: days[0]?.label || pollutant,
        days: days.slice(0, 8),
      }))
      .sort((a, b) => {
        const primary = detailState.detail.primaryPollutant;
        if (a.pollutant === primary) return -1;
        if (b.pollutant === primary) return 1;
        return a.label.localeCompare(b.label);
      });
  }, [detailState]);

  if (detailState?.status !== 'loaded') {
    return (
      <DetailShell
        detailState={detailState}
        selectedStation={selectedStation}
      />
    );
  }

  return (
    <Paper elevation={0} sx={{ ...surfaceSx, p: { xs: 2, md: 2.5 } }}>
      <Typography variant="h6" sx={{ fontWeight: 900 }}>
        Short-range forecast
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
        Forecast values are grouped by pollutant where WAQI provides daily min,
        average and max AQI estimates.
      </Typography>

      {!forecastGroups.length && (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          WAQI does not provide forecast data for this station.
        </Typography>
      )}

      <Box sx={{ display: 'grid', gap: 2 }}>
        {forecastGroups.map((group) => (
          <Box key={group.pollutant}>
            <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1 }}>
              {group.label}
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(2, minmax(0, 1fr))',
                  sm: 'repeat(4, minmax(0, 1fr))',
                  lg: 'repeat(8, minmax(0, 1fr))',
                },
                gap: 1,
              }}
            >
              {group.days.map((day) => (
                <Box
                  key={`${day.pollutant}-${day.day}`}
                  sx={{
                    border: '1px solid rgba(17,24,39,0.1)',
                    borderRadius: 1,
                    p: 1,
                    minHeight: 112,
                    backgroundColor: `${day.category.color}14`,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary' }}
                  >
                    {formatDay(day.day)}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 900 }}>
                    {formatAqi(day.avg)}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={barPercent(day.avg, 300)}
                    sx={{
                      my: 1,
                      height: 6,
                      borderRadius: 1,
                      backgroundColor: 'rgba(17,24,39,0.08)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: day.category.color,
                      },
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary' }}
                  >
                    {formatAqi(day.min)}-{formatAqi(day.max)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}

function StationExplorer({
  activeCategory,
  filteredStations,
  onSelectCategory,
  onSelectStation,
  query,
  selectedStationId,
  setQuery,
  stationCount,
}: {
  activeCategory: CategoryFilter;
  filteredStations: AirQualityStation[];
  onSelectCategory: (category: CategoryFilter) => void;
  onSelectStation: (station: AirQualityStation) => void;
  query: string;
  selectedStationId?: string;
  setQuery: (value: string) => void;
  stationCount: number;
}) {
  return (
    <Paper elevation={0} sx={{ ...surfaceSx, p: { xs: 2, md: 2.5 } }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 320px' },
          gap: 2,
          alignItems: 'center',
          mb: 1.5,
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Station explorer
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
          label={`All ${stationCount}`}
          clickable
          onClick={() => onSelectCategory('all')}
          color={activeCategory === 'all' ? 'primary' : 'default'}
          sx={{ borderRadius: 1, fontWeight: 800 }}
        />
        {AQI_CATEGORIES.map((category) => (
          <Chip
            key={category.key}
            label={category.shortLabel}
            clickable
            onClick={() => onSelectCategory(category.key)}
            variant={activeCategory === category.key ? 'filled' : 'outlined'}
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
        ))}
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
              px: 0.75,
              borderRadius: 1,
              backgroundColor:
                station.id === selectedStationId
                  ? `${station.category.color}12`
                  : 'transparent',
            }}
          >
            <ListItemText
              primary={station.name}
              secondary={station.updatedAt || 'Update time unavailable'}
              primaryTypographyProps={{ fontWeight: 800 }}
            />
            <Chip
              label={station.category.label}
              size="small"
              sx={{
                justifySelf: { xs: 'start', sm: 'end' },
                borderRadius: 1,
                backgroundColor: `${station.category.color}24`,
                color: '#1f2933',
                fontWeight: 800,
              }}
            />
            <ButtonBase
              onClick={() => onSelectStation(station)}
              sx={{ borderRadius: 1, justifySelf: { xs: 'start', sm: 'end' } }}
            >
              <AqiChip aqi={station.aqi} />
            </ButtonBase>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}

const InsightsDashboard: React.FC<InsightsDashboardProps> = ({ stations }) => {
  const [activeTab, setActiveTab] = useState<InsightTab>('overview');
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [selectedStationId, setSelectedStationId] = useState<string>('');
  const [detailStates, setDetailStates] = useState<Record<string, DetailState>>(
    {}
  );

  const insights = useMemo(() => computeAqiInsights(stations), [stations]);
  const maxAqi = Math.max(...stations.map((station) => station.aqi), 1);
  const defaultStation =
    insights.representativeWorstStation || insights.worstStation || stations[0];
  const selectedStation =
    stations.find((station) => station.id === selectedStationId) ||
    defaultStation;
  const selectedDetailState = selectedStation
    ? detailStates[selectedStation.id]
    : undefined;
  const loadedDetail =
    selectedDetailState?.status === 'loaded'
      ? selectedDetailState.detail
      : undefined;

  useEffect(() => {
    if (!stations.length) {
      setSelectedStationId('');
      return;
    }

    if (
      !selectedStationId ||
      !stations.some((station) => station.id === selectedStationId)
    ) {
      setSelectedStationId(defaultStation?.id || '');
    }
  }, [defaultStation?.id, selectedStationId, stations]);

  useEffect(() => {
    if (!selectedStation?.providerId) return;
    if (
      selectedDetailState?.status === 'loading' ||
      selectedDetailState?.status === 'loaded'
    ) {
      return;
    }

    setDetailStates((previous) => ({
      ...previous,
      [selectedStation.id]: { status: 'loading' },
    }));

    fetch(
      `${WAQI_BASE_URL}?uid=${encodeURIComponent(selectedStation.providerId)}`
    )
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(
            payload?.error || `WAQI detail failed (${response.status})`
          );
        }
        if (payload?.status && payload.status !== 'ok') {
          throw new Error(payload.data || 'WAQI returned no detail data.');
        }
        const detail = normalizeWaqiStationDetail(payload);
        if (!detail) {
          throw new Error(
            'WAQI detail data could not be read for this station.'
          );
        }
        return detail;
      })
      .then((detail) => {
        setDetailStates((previous) => ({
          ...previous,
          [selectedStation.id]: { status: 'loaded', detail },
        }));
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        setDetailStates((previous) => ({
          ...previous,
          [selectedStation.id]: { status: 'error', error: message },
        }));
      });
  }, [
    selectedDetailState?.status,
    selectedStation?.id,
    selectedStation?.providerId,
  ]);

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

  const selectStation = (station: AirQualityStation, nextTab?: InsightTab) => {
    setSelectedStationId(station.id);
    if (nextTab) setActiveTab(nextTab);
  };

  const riskCategory = insights.riskCategory || insights.dominantCategory;
  const riskTitle = insights.stationCount
    ? `${riskCategory?.shortLabel || 'Live'} risk pattern across loaded stations`
    : 'No live AQI stations loaded';
  const riskCopy = insights.stationCount
    ? `${insights.unhealthyCount} of ${insights.stationCount} loaded stations are above AQI 100. The representative 90th percentile is AQI ${formatAqi(insights.representativeP90Aqi)}, while ${insights.extremeCount} readings are flagged above ${EXTREME_AQI_THRESHOLD}.`
    : 'Move the map or use your location to load stations for a specific area.';

  return (
    <Box
      className="insights-dashboard"
      sx={{
        width: '100%',
        height: '100%',
        minHeight: 0,
        boxSizing: 'border-box',
        overflowY: 'auto',
        overflowX: 'hidden',
        backgroundColor: '#f7f8fa',
        px: { xs: 2, md: 4 },
        pt: { xs: 8, md: 9 },
        pb: { xs: 12, md: 9 },
      }}
    >
      <Box sx={{ maxWidth: 1320, mx: 'auto' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr auto' },
            gap: 2,
            alignItems: 'end',
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="overline" sx={{ color: 'text.secondary' }}>
              Live AQI intelligence
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 950 }}>
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
            ...surfaceSx,
            borderLeft: `6px solid ${riskCategory?.color || '#7a869a'}`,
            p: { xs: 2, md: 3 },
            mb: 2,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1.3fr 0.7fr' },
            gap: 3,
            alignItems: 'center',
          }}
        >
          <Box>
            <Typography variant="overline" sx={{ color: 'text.secondary' }}>
              Area health signal
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 950, mb: 1 }}>
              {riskTitle}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {riskCopy}
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 1,
            }}
          >
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Worst loaded station
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 950 }}>
                {formatAqi(insights.worstStation?.aqi)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Unhealthy share
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 950 }}>
                {formatPercent(insights.unhealthyPercent)}
              </Typography>
            </Box>
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Scope
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800 }}>
                Loaded map sample, not a population-weighted global average.
              </Typography>
            </Box>
          </Box>
        </Paper>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              xl: 'repeat(5, 1fr)',
            },
            gap: 2,
            mb: 2,
          }}
        >
          <MetricCard
            label="Representative P90"
            value={formatAqi(insights.representativeP90Aqi)}
            helper={`Excludes readings above AQI ${EXTREME_AQI_THRESHOLD}`}
            accent={riskCategory?.color || '#0f766e'}
          />
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
            accent={insights.dominantCategory?.color || '#7a869a'}
          />
          <MetricCard
            label="Fresh data"
            value={formatPercent(insights.freshnessPercent)}
            helper={`${insights.staleCount} stale, ${insights.unknownFreshnessCount} unknown`}
            accent="#0f766e"
          />
          <MetricCard
            label="Extreme readings"
            value={String(insights.extremeCount)}
            helper={`Above AQI ${EXTREME_AQI_THRESHOLD}; review as unvalidated outliers`}
            accent="#7e0023"
          />
        </Box>

        <Box
          sx={{
            mb: 2,
            py: 0.5,
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_event, value: InsightTab) => setActiveTab(value)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 44,
              '& .MuiTab-root': {
                minHeight: 44,
                borderRadius: 1,
                textTransform: 'none',
                fontWeight: 900,
              },
            }}
          >
            {tabLabels.map((tab) => (
              <Tab key={tab.value} value={tab.value} label={tab.label} />
            ))}
          </Tabs>
        </Box>

        {activeTab === 'overview' && (
          <Box sx={{ display: 'grid', gap: 2 }}>
            <CategoryDistribution
              activeCategory={activeCategory}
              categoryCounts={insights.categoryCounts}
              onSelectCategory={setActiveCategory}
            />
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
                gap: 2,
              }}
            >
              <StationRankPanel
                maxAqi={maxAqi}
                onSelectStation={(station) =>
                  selectStation(station, 'pollutants')
                }
                selectedStationId={selectedStation?.id}
                stations={insights.topStations.slice(0, 5)}
                title="Hotspots to inspect"
              />
              <Paper elevation={0} sx={{ ...surfaceSx, p: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>
                  Selected station
                </Typography>
                {selectedStation && (
                  <Box sx={{ display: 'grid', gap: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 900 }}>
                      {loadedDetail?.name || selectedStation.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: 'text.secondary' }}
                    >
                      {loadedDetail?.primaryPollutantLabel
                        ? `Current driver: ${loadedDetail.primaryPollutantLabel}`
                        : 'Open the Pollutants tab for station-level WAQI detail.'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <AqiChip aqi={loadedDetail?.aqi || selectedStation.aqi} />
                      <Chip
                        label={
                          loadedDetail?.category.label ||
                          selectedStation.category.label
                        }
                        size="small"
                        sx={{ borderRadius: 1, fontWeight: 800 }}
                      />
                    </Box>
                  </Box>
                )}
                {!selectedStation && (
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    No station is selected.
                  </Typography>
                )}
              </Paper>
            </Box>
          </Box>
        )}

        {activeTab === 'hotspots' && (
          <Box sx={{ display: 'grid', gap: 2 }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
                gap: 2,
              }}
            >
              <StationRankPanel
                maxAqi={maxAqi}
                onSelectStation={(station) =>
                  selectStation(station, 'pollutants')
                }
                selectedStationId={selectedStation?.id}
                stations={insights.topStations}
                title="Highest AQI stations"
              />
              <StationRankPanel
                maxAqi={maxAqi}
                onSelectStation={(station) =>
                  selectStation(station, 'pollutants')
                }
                selectedStationId={selectedStation?.id}
                stations={insights.cleanestStations}
                title="Cleanest monitored stations"
              />
            </Box>
            <StationExplorer
              activeCategory={activeCategory}
              filteredStations={filteredStations}
              onSelectCategory={setActiveCategory}
              onSelectStation={(station) =>
                selectStation(station, 'pollutants')
              }
              query={query}
              selectedStationId={selectedStation?.id}
              setQuery={setQuery}
              stationCount={stations.length}
            />
          </Box>
        )}

        {activeTab === 'pollutants' && (
          <PollutantPanel
            detailState={selectedDetailState}
            selectedStation={selectedStation}
          />
        )}

        {activeTab === 'forecast' && (
          <ForecastPanel
            detailState={selectedDetailState}
            selectedStation={selectedStation}
          />
        )}

        {activeTab === 'quality' && (
          <Box sx={{ display: 'grid', gap: 2 }}>
            <Paper elevation={0} sx={{ ...surfaceSx, p: { xs: 2, md: 2.5 } }}>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Data quality and coverage
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: 'text.secondary', mb: 2 }}
              >
                WAQI station data is useful for live exploration, but loaded
                stations are not a population-weighted sample and values can be
                preliminary.
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                  gap: 2,
                }}
              >
                <MetricCard
                  label="Loaded stations"
                  value={String(insights.stationCount)}
                  helper="Current map/query sample"
                  accent="#2563eb"
                />
                <MetricCard
                  label="Known timestamps"
                  value={String(insights.knownFreshnessCount)}
                  helper={`${insights.freshStationCount} fresh, ${insights.staleCount} stale`}
                  accent="#0f766e"
                />
                <MetricCard
                  label="Unknown freshness"
                  value={String(insights.unknownFreshnessCount)}
                  helper="Stations without a parseable update time"
                  accent="#f59e0b"
                />
                <MetricCard
                  label="Extreme readings"
                  value={String(insights.extremeCount)}
                  helper="Above the common AQI display scale"
                  accent="#7e0023"
                />
              </Box>
            </Paper>

            <Paper elevation={0} sx={{ ...surfaceSx, p: { xs: 2, md: 2.5 } }}>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Selected station source
              </Typography>
              <DetailShell
                detailState={selectedDetailState}
                selectedStation={selectedStation}
              />
              {selectedDetailState?.status === 'loaded' && (
                <Box sx={{ display: 'grid', gap: 1, mt: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 900 }}>
                    {selectedDetailState.detail.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {selectedDetailState.detail.updatedAt
                      ? `Updated ${selectedDetailState.detail.updatedAt}`
                      : 'Update time unavailable'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {selectedDetailState.detail.attributions.map(
                      (attribution) => (
                        <Chip
                          key={`${attribution.name}-${attribution.url || ''}`}
                          component={attribution.url ? 'a' : 'div'}
                          href={attribution.url}
                          target={attribution.url ? '_blank' : undefined}
                          rel={
                            attribution.url ? 'noopener noreferrer' : undefined
                          }
                          label={attribution.name}
                          clickable={Boolean(attribution.url)}
                          size="small"
                          sx={{ borderRadius: 1, maxWidth: '100%' }}
                        />
                      )
                    )}
                  </Box>
                </Box>
              )}
            </Paper>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default InsightsDashboard;
