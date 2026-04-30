import React from 'react';
import { Box, CircularProgress, Fade, Typography } from '@mui/material';

interface LoadingOverlayProps {
  loading: boolean;
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  loading,
  message,
}) => {
  return (
    <Fade in={loading} unmountOnExit>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          bgcolor: 'rgba(255, 255, 255, 0.95)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2000,
        }}
      >
        <Box
          sx={{
            display: 'grid',
            placeItems: 'center',
            width: 96,
            height: 96,
            borderRadius: '50%',
            background:
              'radial-gradient(circle at 35% 30%, #ffffff 0, #d9f3ee 46%, #2a9d8f 100%)',
            boxShadow: '0 20px 48px rgba(42,157,143,0.24)',
          }}
        >
          <CircularProgress
            size={74}
            thickness={2.5}
            sx={{ color: '#17202a' }}
          />
        </Box>
        {message && (
          <Typography variant="h6" sx={{ mt: 2, color: 'text.primary' }}>
            {message}
          </Typography>
        )}
      </Box>
    </Fade>
  );
};

export default LoadingOverlay;
