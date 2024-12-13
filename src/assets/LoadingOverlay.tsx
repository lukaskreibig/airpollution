// src/components/LoadingOverlay/LoadingOverlay.tsx

import React from "react";
import { Box, Typography, Fade } from "@mui/material";
import Lottie from "lottie-react";
import loadingAnimation from "./loadingworld.json"; // your Lottie JSON

interface LoadingOverlayProps {
  loading: boolean;
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ loading, message }) => {
  return (
    <Fade in={loading} unmountOnExit>
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          bgcolor: "rgba(255, 255, 255, 0.95)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 2000, // Over everything
        }}
      >
        <Box sx={{ width: 200, height: 200 }}>
          <Lottie animationData={loadingAnimation} loop={true} />
        </Box>
        {message && (
          <Typography variant="h6" sx={{ mt: 2, color: "text.primary" }}>
            {message}
          </Typography>
        )}
      </Box>
    </Fade>
  );
};

export default LoadingOverlay;
