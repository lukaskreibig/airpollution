import React, { useMemo } from 'react';
import { AirQualityStation, formatAqi, getAqiCategory } from '../../aqi';
import { computeAqiInsights } from '../../insights';
import { DetailState } from '../../hooks/useStationDetail';
import { MapPinIcon } from '../icons';
import ForecastChart from '../StationDetail/ForecastChart';
import Gauge from './Gauge';
import Histogram from './Histogram';

interface InsightsViewProps {
  stations: AirQualityStation[];
  selectedStation: AirQualityStation | null;
  detailState: DetailState;
  onSelectStation: (station: AirQualityStation) => void;
  onShowOnMap: (station: AirQualityStation) => void;
}

function LeaderboardRow({
  index,
  station,
  maxAqi,
  active,
  onSelect,
}: {
  index: number;
  station: AirQualityStation;
  maxAqi: number;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className="board-row"
      data-active={active}
      onClick={onSelect}
      style={{ '--row-color': station.category.color } as React.CSSProperties}
      aria-label={`${station.name} AQI ${station.aqi}`}
    >
      <span className="board-rank mono">{index + 1}</span>
      <span className="board-name">
        <strong>{station.name}</strong>
        <span className="board-bar">
          <i
            style={{ width: `${Math.min((station.aqi / maxAqi) * 100, 100)}%` }}
          />
        </span>
      </span>
      <span
        className="aqi-chip"
        style={{
          backgroundColor: station.category.color,
          color: station.category.foreground,
        }}
      >
        {station.aqi}
      </span>
    </button>
  );
}

const InsightsView: React.FC<InsightsViewProps> = ({
  stations,
  selectedStation,
  detailState,
  onSelectStation,
  onShowOnMap,
}) => {
  const insights = useMemo(() => computeAqiInsights(stations), [stations]);

  const dominant = insights.dominantCategory;
  const medianCategory = getAqiCategory(insights.medianAqi);
  const worst = insights.representativeWorstStation || insights.worstStation;
  const maxBoardAqi = Math.max(
    ...insights.topStations.map((station) => station.aqi),
    100
  );

  const detail = detailState.status === 'loaded' ? detailState.detail : null;
  const spotForecast = detail?.forecast.filter(
    (day) => day.pollutant === detail.primaryPollutant
  );
  const spotForecastGroup =
    spotForecast && spotForecast.length > 1
      ? spotForecast
      : detail?.forecast.filter(
          (day) => day.pollutant === detail?.forecast[0]?.pollutant
        );
  const maxPollutant = Math.max(
    120,
    ...(detail?.pollutants.map((pollutant) => pollutant.value) ?? [])
  );

  if (!stations.length) {
    return (
      <div className="insights insights-dashboard">
        <div className="insights-inner">
          <section className="card">
            <h2>No stations loaded</h2>
            <p className="card-sub">
              Move the map or use your location to load live AQI stations, then
              come back for the analysis.
            </p>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="insights insights-dashboard">
      <div className="insights-inner">
        {/* ---- Hero: the pulse of the loaded area ---- */}
        <section
          className="card ins-hero"
          style={
            {
              '--hero-color': dominant?.color || '#7dd3fc',
            } as React.CSSProperties
          }
        >
          <Gauge value={insights.medianAqi} label="median AQI" />
          <div className="ins-hero-copy">
            <span className="kicker">Air quality insights · live sample</span>
            <h1>
              Air in view is mostly <em>{dominant?.label || 'unknown'}</em>
            </h1>
            <p>
              {stations.length.toLocaleString()} stations are reporting live in
              the current map area. The median reading is AQI{' '}
              {formatAqi(insights.medianAqi)} ({medianCategory.label}
              ), and {insights.unhealthyCount} station
              {insights.unhealthyCount === 1 ? '' : 's'} (
              {Math.round(insights.unhealthyPercent)}%) read above AQI 100.
              {worst
                ? ` The heaviest air right now: ${worst.name} at AQI ${worst.aqi}.`
                : ''}
            </p>
            <div className="ins-hero-stats">
              <div className="ins-stat">
                <strong>{stations.length.toLocaleString()}</strong>
                <span>stations</span>
              </div>
              <div className="ins-stat">
                <strong style={{ color: medianCategory.color }}>
                  {formatAqi(insights.medianAqi)}
                </strong>
                <span>median</span>
              </div>
              <div className="ins-stat">
                <strong>{formatAqi(insights.representativeP90Aqi)}</strong>
                <span>90th pct</span>
              </div>
              <div className="ins-stat">
                <strong
                  style={{
                    color:
                      insights.unhealthyPercent > 0
                        ? 'var(--aqi-unhealthy)'
                        : 'var(--aqi-good)',
                  }}
                >
                  {Math.round(insights.unhealthyPercent)}%
                </strong>
                <span>unhealthy+</span>
              </div>
              {insights.extremeCount > 0 && (
                <div className="ins-stat">
                  <strong style={{ color: 'var(--aqi-hazardous)' }}>
                    {insights.extremeCount}
                  </strong>
                  <span>extreme &gt;500</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ---- Distribution ---- */}
        <section className="card">
          <div className="card-head">
            <div>
              <h2>The AQI spectrum</h2>
              <p className="card-sub">
                How every live reading in view distributes across the health
                scale. Bar height is square-root scaled so unhealthy tails stay
                visible.
              </p>
            </div>
          </div>
          <Histogram
            stations={stations}
            medianAqi={insights.medianAqi}
            p90Aqi={insights.representativeP90Aqi}
          />
        </section>

        {/* ---- Category breakdown ---- */}
        <section className="card">
          <div className="card-head">
            <div>
              <h2>Health categories</h2>
              <p className="card-sub">
                Share of stations per AQI health band in the loaded area.
              </p>
            </div>
          </div>
          <div className="catbar" aria-hidden="true">
            {insights.categoryCounts.map((category) => (
              <i
                key={category.key}
                style={{
                  width: `${category.percent}%`,
                  minWidth: category.count ? 4 : 0,
                  backgroundColor: category.color,
                }}
              />
            ))}
          </div>
          <div className="cat-rows">
            {insights.categoryCounts.map((category) => (
              <div
                key={category.key}
                className="cat-row"
                data-active={false}
                style={{ '--row-color': category.color } as React.CSSProperties}
              >
                <span className="dot" />
                <span className="cat-name">
                  {category.label}
                  <span className="cat-range"> · AQI {category.range}</span>
                </span>
                <span className="cat-count mono">{category.count}</span>
                <span
                  className="cat-count mono"
                  style={{ minWidth: 44, textAlign: 'right' }}
                >
                  {Math.round(category.percent)}%
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ---- Leaderboards ---- */}
        <div className="ins-grid-2">
          <section className="card">
            <div className="card-head">
              <div>
                <h2>Pollution hotspots</h2>
                <p className="card-sub">
                  Highest AQI stations in view. Click one to inspect it below.
                </p>
              </div>
            </div>
            <div className="board">
              {insights.topStations.map((station, index) => (
                <LeaderboardRow
                  key={station.id}
                  index={index}
                  station={station}
                  maxAqi={maxBoardAqi}
                  active={station.id === selectedStation?.id}
                  onSelect={() => onSelectStation(station)}
                />
              ))}
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <div>
                <h2>Cleanest air right now</h2>
                <p className="card-sub">
                  The freshest readings currently monitored in view.
                </p>
              </div>
            </div>
            <div className="board">
              {insights.cleanestStations.map((station, index) => (
                <LeaderboardRow
                  key={station.id}
                  index={index}
                  station={station}
                  maxAqi={maxBoardAqi}
                  active={station.id === selectedStation?.id}
                  onSelect={() => onSelectStation(station)}
                />
              ))}
            </div>
          </section>
        </div>

        {/* ---- Station spotlight ---- */}
        <section className="card">
          <div className="card-head">
            <div>
              <h2>Station spotlight</h2>
              <p className="card-sub">
                Pollutant drivers and short-range forecast for the selected
                station, straight from WAQI.
              </p>
            </div>
          </div>

          {selectedStation ? (
            <div className="spotlight">
              <div className="spot-aside">
                <h3 className="spot-title">
                  {detail?.name || selectedStation.name}
                </h3>
                <div className="spot-reading">
                  <strong style={{ color: selectedStation.category.color }}>
                    {detail?.aqi ?? selectedStation.aqi}
                  </strong>
                  <div>
                    <div
                      className="detail-hero-cat"
                      style={{ color: selectedStation.category.color }}
                    >
                      {(detail?.category || selectedStation.category).label}
                    </div>
                    <div className="detail-hero-msg">
                      {
                        (detail?.category || selectedStation.category)
                          .healthMessage
                      }
                    </div>
                  </div>
                </div>
                <div className="spot-actions">
                  <button
                    type="button"
                    className="btn"
                    onClick={() => onShowOnMap(selectedStation)}
                  >
                    <MapPinIcon style={{ width: 14, height: 14 }} />
                    View on map
                  </button>
                </div>
                <div className="detail-meta">
                  {(detail?.updatedAt || selectedStation.updatedAt) && (
                    <span>
                      Updated {detail?.updatedAt || selectedStation.updatedAt}
                    </span>
                  )}
                  <span>
                    Source: WAQI
                    {detail?.attributions?.length
                      ? ` · ${detail.attributions
                          .map((attribution) => attribution.name)
                          .slice(0, 2)
                          .join(' · ')}`
                      : ''}
                  </span>
                </div>
              </div>

              <div className="spot-aside">
                {detailState.status === 'loading' && (
                  <div className="detail-loading">
                    <i style={{ width: '82%' }} />
                    <i style={{ width: '64%' }} />
                    <i style={{ width: '74%' }} />
                  </div>
                )}
                {detailState.status === 'error' && (
                  <p className="detail-error">
                    Detailed WAQI data could not be loaded: {detailState.error}
                  </p>
                )}
                {detail && detail.pollutants.length > 0 && (
                  <div className="detail-section">
                    <h3>Pollutants · AQI contribution</h3>
                    {detail.pollutants.map((pollutant) => (
                      <div
                        key={pollutant.key}
                        className="pollutant-row"
                        style={
                          {
                            '--row-color': pollutant.category.color,
                          } as React.CSSProperties
                        }
                      >
                        <span className="p-name">
                          {pollutant.label}
                          {pollutant.isPrimary && (
                            <i className="p-driver" title="Main driver" />
                          )}
                        </span>
                        <span className="p-track">
                          <i
                            style={{
                              width: `${Math.min(
                                (pollutant.value / maxPollutant) * 100,
                                100
                              )}%`,
                            }}
                          />
                        </span>
                        <span className="p-val">{pollutant.value}</span>
                      </div>
                    ))}
                  </div>
                )}
                {spotForecastGroup && spotForecastGroup.length > 1 && (
                  <div className="detail-section">
                    <h3>Forecast · next days</h3>
                    <ForecastChart
                      days={spotForecastGroup}
                      label={spotForecastGroup[0].label}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="card-sub">
              Select a station from the leaderboards above.
            </p>
          )}
        </section>

        {/* ---- Data quality footer ---- */}
        <section className="card ins-footer">
          <span>
            data freshness · {insights.freshStationCount} fresh /{' '}
            {insights.staleCount} stale / {insights.unknownFreshnessCount}{' '}
            unknown
          </span>
          {insights.latestUpdate && (
            <span>latest update {insights.latestUpdate}</span>
          )}
          <span className="spacer" />
          <span>
            loaded map sample — not a population-weighted average · data{' '}
            <a
              href="https://aqicn.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              WAQI
            </a>
          </span>
        </section>
      </div>
    </div>
  );
};

export default InsightsView;
