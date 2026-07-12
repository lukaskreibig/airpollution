import React from 'react';
import { ViewMode } from '../viewMode';
import { ListIcon, LocateIcon } from './icons';

interface TopBarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  stationCount: number;
  railOpen: boolean;
  onToggleRail: () => void;
  onUseMyLocation: () => void;
}

const TopBar: React.FC<TopBarProps> = ({
  viewMode,
  onViewModeChange,
  stationCount,
  railOpen,
  onToggleRail,
  onUseMyLocation,
}) => (
  <header className="topbar">
    <div className="brand glass">
      <span className="brand-pulse" aria-hidden="true" />
      <div>
        <div className="brand-name">
          map<em>the</em>air
        </div>
        <div className="brand-sub">live air observatory</div>
      </div>
    </div>

    <div className="topbar-spacer" />

    <div className="topbar-cluster glass">
      <div className="station-ticker">
        <strong className="mono">{stationCount.toLocaleString()}</strong>
        <span>stations in view</span>
      </div>
      <nav className="seg" aria-label="View">
        <button
          type="button"
          data-active={viewMode === 'map'}
          onClick={() => onViewModeChange('map')}
        >
          Map
        </button>
        <button
          type="button"
          data-active={viewMode === 'insights'}
          onClick={() => onViewModeChange('insights')}
        >
          Insights
        </button>
      </nav>
      {viewMode === 'map' && (
        <button
          type="button"
          className="icon-btn"
          onClick={onToggleRail}
          aria-label={railOpen ? 'Close station list' : 'Open station list'}
          aria-pressed={railOpen}
        >
          <ListIcon />
        </button>
      )}
      <button
        type="button"
        className="icon-btn"
        onClick={onUseMyLocation}
        aria-label="Use my location"
        title="Use my location"
      >
        <LocateIcon />
      </button>
    </div>
  </header>
);

export default TopBar;
