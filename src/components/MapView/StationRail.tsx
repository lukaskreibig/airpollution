import React, { useMemo, useState } from 'react';
import { AirQualityStation } from '../../aqi';
import { CloseIcon, SearchIcon, SortIcon } from '../icons';

type SortOrder = 'worst' | 'best' | 'name';

const SORT_LABEL: Record<SortOrder, string> = {
  worst: 'Worst first',
  best: 'Cleanest first',
  name: 'A to Z',
};

const NEXT_SORT: Record<SortOrder, SortOrder> = {
  worst: 'best',
  best: 'name',
  name: 'worst',
};

interface StationRailProps {
  open: boolean;
  stations: AirQualityStation[];
  selectedStationId: string | null;
  onSelectStation: (station: AirQualityStation) => void;
  onClose: () => void;
}

const StationRail: React.FC<StationRailProps> = ({
  open,
  stations,
  selectedStationId,
  onSelectStation,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('worst');

  const visibleStations = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = normalized
      ? stations.filter((station) =>
          station.name.toLowerCase().includes(normalized)
        )
      : stations;

    return [...filtered].sort((a, b) => {
      if (sortOrder === 'name') return a.name.localeCompare(b.name);
      if (sortOrder === 'best') return a.aqi - b.aqi;
      return b.aqi - a.aqi;
    });
  }, [stations, query, sortOrder]);

  const maxAqi = Math.max(...stations.map((station) => station.aqi), 100);

  return (
    <aside className="rail glass" data-open={open} aria-hidden={!open}>
      <div className="rail-head">
        <h2>
          Stations in view
          <span className="kicker mono">
            {visibleStations.length} of {stations.length} live readings
          </span>
        </h2>
        <button
          type="button"
          className="icon-btn"
          onClick={onClose}
          aria-label="Close station list"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="rail-tools">
        <label className="field search-field" aria-label="Search stations">
          <SearchIcon />
          <input
            type="search"
            placeholder="Search stations…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <button
          type="button"
          className="btn rail-sort"
          onClick={() => setSortOrder((prev) => NEXT_SORT[prev])}
          aria-label={`Change sorting, currently ${SORT_LABEL[sortOrder]}`}
          title="Change sorting"
        >
          <SortIcon style={{ width: 14, height: 14 }} />
          {SORT_LABEL[sortOrder]}
        </button>
      </div>

      <div className="rail-list" role="list">
        {visibleStations.length === 0 && (
          <div className="rail-empty">
            No stations match your search in the current map area.
          </div>
        )}
        {visibleStations.slice(0, 250).map((station, index) => (
          <button
            key={station.id}
            type="button"
            role="listitem"
            className="rail-row"
            data-active={station.id === selectedStationId}
            onClick={() => onSelectStation(station)}
            aria-label={`${station.name} ${station.aqi} ${station.category.label}`}
            style={
              { '--row-color': station.category.color } as React.CSSProperties
            }
          >
            <span className="rail-rank mono">{index + 1}</span>
            <span className="rail-name">
              <strong>{station.name}</strong>
              <span className="rail-bar">
                <i
                  style={{
                    width: `${Math.min((station.aqi / maxAqi) * 100, 100)}%`,
                  }}
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
        ))}
      </div>
    </aside>
  );
};

export default StationRail;
