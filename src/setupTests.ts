import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import {
  ReadableStream,
  WritableStream,
  TransformStream,
} from 'node:stream/web';

/** Polyfill URL.createObjectURL so Plotly or other libs won't crash */
if (!window.URL.createObjectURL) {
  window.URL.createObjectURL = () => 'mocked-object-url';
}

/** Polyfill TextEncoder/TextDecoder for map rendering and other libs */
if (typeof global.TextEncoder === 'undefined') {
  (global as any).TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  (global as any).TextDecoder = TextDecoder;
}

/** Polyfill web streams for msw v2 in Jest/jsdom */
if (typeof global.ReadableStream === 'undefined') {
  (global as any).ReadableStream = ReadableStream;
}
if (typeof global.WritableStream === 'undefined') {
  (global as any).WritableStream = WritableStream;
}
if (typeof global.TransformStream === 'undefined') {
  (global as any).TransformStream = TransformStream;
}

/** Polyfill BroadcastChannel for msw v2 in Jest/jsdom */
if (typeof global.BroadcastChannel === 'undefined') {
  class MockBroadcastChannel {
    name: string;

    onmessage: ((event: MessageEvent) => void) | null = null;

    constructor(name: string) {
      this.name = name;
    }

    postMessage() {}

    close() {}

    addEventListener() {}

    removeEventListener() {}
  }

  (global as any).BroadcastChannel = MockBroadcastChannel;
}
