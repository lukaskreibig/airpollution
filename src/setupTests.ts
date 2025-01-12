import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

/** Polyfill URL.createObjectURL so Plotly or other libs won't crash */
if (!window.URL.createObjectURL) {
  window.URL.createObjectURL = () => 'mocked-object-url';
}

/** Polyfill TextEncoder/TextDecoder for mapbox-gl or other libs */
if (typeof global.TextEncoder === 'undefined') {
  (global as any).TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  (global as any).TextDecoder = TextDecoder;
}
