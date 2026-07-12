import React from 'react';

interface LoadingScreenProps {
  loading: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ loading }) => (
  <div
    className="loading-screen"
    data-done={!loading}
    role="status"
    aria-hidden={!loading}
  >
    <div className="loading-inner">
      <div className="orbit" aria-hidden="true">
        <i />
        <i />
        <i />
        <em />
      </div>
      <div className="loading-word">
        map<em>the</em>air
      </div>
      <div className="loading-status">Loading AQI stations…</div>
    </div>
  </div>
);

export default LoadingScreen;
