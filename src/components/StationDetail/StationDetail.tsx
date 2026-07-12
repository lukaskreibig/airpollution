import React, { useEffect, useMemo, useState } from 'react';
import {
  AirQualityStation,
  AqiPollutantKey,
  WaqiForecastDay,
  WaqiStationDetail,
} from '../../aqi';
import { DetailState } from '../../hooks/useStationDetail';
import { CloseIcon } from '../icons';
import ForecastChart from './ForecastChart';

interface StationDetailProps {
  open: boolean;
  station: AirQualityStation | null;
  detailState: DetailState;
  onClose: () => void;
}

interface ForecastGroup {
  pollutant: AqiPollutantKey;
  label: string;
  days: WaqiForecastDay[];
}

function groupForecast(detail: WaqiStationDetail): ForecastGroup[] {
  const groups = new Map<AqiPollutantKey, ForecastGroup>();
  detail.forecast.forEach((day) => {
    const group = groups.get(day.pollutant) || {
      pollutant: day.pollutant,
      label: day.label,
      days: [],
    };
    group.days.push(day);
    groups.set(day.pollutant, group);
  });

  return Array.from(groups.values()).sort((a, b) => {
    if (a.pollutant === detail.primaryPollutant) return -1;
    if (b.pollutant === detail.primaryPollutant) return 1;
    return a.label.localeCompare(b.label);
  });
}

const StationDetail: React.FC<StationDetailProps> = ({
  open,
  station,
  detailState,
  onClose,
}) => {
  const detail = detailState.status === 'loaded' ? detailState.detail : null;
  const forecastGroups = useMemo(
    () => (detail ? groupForecast(detail) : []),
    [detail]
  );
  const [forecastKey, setForecastKey] = useState<AqiPollutantKey | null>(null);

  useEffect(() => {
    setForecastKey(forecastGroups[0]?.pollutant ?? null);
  }, [forecastGroups]);

  const activeForecast =
    forecastGroups.find((group) => group.pollutant === forecastKey) ||
    forecastGroups[0];

  const shown = detail && station ? detail : null;
  const aqi = shown?.aqi ?? station?.aqi;
  const category = shown?.category ?? station?.category;
  const maxPollutant = Math.max(
    120,
    ...(shown?.pollutants.map((pollutant) => pollutant.value) ?? [])
  );

  return (
    <section
      className="detail glass"
      data-open={open && Boolean(station)}
      aria-hidden={!open || !station}
      aria-label="Station detail"
    >
      {station && category && (
        <div className="detail-scroll">
          <div className="detail-head">
            <h2>{shown?.name || station.name}</h2>
            <button
              type="button"
              className="icon-btn"
              onClick={onClose}
              aria-label="Close station detail"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="detail-hero">
            <div className="detail-hero-num" style={{ color: category.color }}>
              {aqi}
            </div>
            <div>
              <div
                className="detail-hero-cat"
                style={{ color: category.color }}
              >
                {category.label}
              </div>
              <div className="detail-hero-msg">{category.healthMessage}</div>
            </div>
          </div>

          {detailState.status === 'loading' && (
            <div className="detail-loading" aria-label="Loading station data">
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

          {!station.providerId && (
            <p className="detail-error">
              This station does not expose detailed pollutant data.
            </p>
          )}

          {shown && shown.pollutants.length > 0 && (
            <div className="detail-section">
              <h3>Pollutants · AQI contribution</h3>
              {shown.pollutants.map((pollutant) => (
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
              {shown.primaryPollutantLabel && (
                <p className="forecast-caption">
                  {shown.primaryPollutantLabel} currently drives this
                  station&apos;s AQI.
                </p>
              )}
            </div>
          )}

          {activeForecast && activeForecast.days.length > 1 && (
            <div className="detail-section">
              <h3>Forecast · next days</h3>
              {forecastGroups.length > 1 && (
                <div
                  className="seg"
                  role="group"
                  aria-label="Forecast pollutant"
                  style={{ marginBottom: 12 }}
                >
                  {forecastGroups.slice(0, 4).map((group) => (
                    <button
                      key={group.pollutant}
                      type="button"
                      data-active={group.pollutant === activeForecast.pollutant}
                      onClick={() => setForecastKey(group.pollutant)}
                    >
                      {group.label}
                    </button>
                  ))}
                </div>
              )}
              <ForecastChart
                days={activeForecast.days}
                label={activeForecast.label}
              />
            </div>
          )}

          <div className="detail-meta">
            {(shown?.updatedAt || station.updatedAt) && (
              <span>Updated {shown?.updatedAt || station.updatedAt}</span>
            )}
            <span>
              Source: WAQI
              {shown?.attributions?.length
                ? ` · ${shown.attributions
                    .map((attribution) => attribution.name)
                    .slice(0, 3)
                    .join(' · ')}`
                : ''}
            </span>
            {shown?.sourceUrl && (
              <a
                href={shown.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open on aqicn.org
              </a>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default StationDetail;
