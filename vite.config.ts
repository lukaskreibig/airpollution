import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      'process.env.VITE_MAPTILER_API_KEY': JSON.stringify(
        env.VITE_MAPTILER_API_KEY || ''
      ),
      'process.env.VITE_MAPTILER_STYLE_ID': JSON.stringify(
        env.VITE_MAPTILER_STYLE_ID || ''
      ),
      'process.env.VITE_WAQI_API_BASE_URL': JSON.stringify(
        env.VITE_WAQI_API_BASE_URL || ''
      ),
    },
    server: {
      port: 3000,
    },
    build: {
      sourcemap: true,
      chunkSizeWarningLimit: 1100,
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              {
                name: 'map',
                test: /node_modules[\\/]maplibre-gl/,
                priority: 4,
              },
              {
                name: 'ui',
                test: /node_modules[\\/](@mui|@emotion|@ant-design)/,
                priority: 3,
              },
              {
                name: 'react',
                test: /node_modules[\\/](react|react-dom)/,
                priority: 2,
              },
              {
                name: 'vendor',
                test: /node_modules/,
                priority: 1,
              },
            ],
          },
        },
      },
    },
  };
});
