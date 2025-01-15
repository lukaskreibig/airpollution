import React from 'react';

const PersistentOverlay: React.FC = () => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 9999,
        pointerEvents: 'all',
      }}
    />
  );
};

export default PersistentOverlay;
