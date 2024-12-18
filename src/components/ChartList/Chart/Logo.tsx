import { Typography, Box } from "@mui/material";

const Logo = () => {
  return (
    <Box display="flex" flexDirection="column" alignItems="center">
      <Box display="flex" alignItems="center" justifyContent="center">
        <Typography
          variant="h4"
          component="span"
          sx={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 600,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: "black",

          }}
        >
          Map
        </Typography>
        <Typography
          variant="h4"
          component="span"
          sx={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 400,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            mx: 0.5,
            color: "black",

          }}
        >
          The
        </Typography>
        <Typography
          variant="h4"
          component="span"
          sx={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 700,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: "black",
          }}
        >
          Air
        </Typography>
      </Box>

      {/* Subtitle */}
      <Box sx={{ width: "100%", textAlign: "center", mb: 1}}>
      <Typography
  variant="subtitle2"
  sx={{
    fontFamily: "'Roboto', sans-serif",
    fontWeight: 300,
    fontSize: "0.9rem",
    letterSpacing: "0.03em",
    textAlign: "center",
    color: "white",
    backgroundColor: "#444",
    px: 1.5,
    py: 0.5,
    borderRadius: "4px",
  }}
>
  Real-time Air Quality Insights
</Typography>
</Box>
    </Box>
  );
};

export default Logo;
