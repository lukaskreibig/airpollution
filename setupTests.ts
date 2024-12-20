// setupTests.js
// Make sure this is BEFORE importing '@testing-library/jest-dom'
  
  if (!window.URL.createObjectURL) {
    window.URL.createObjectURL = jest.fn(() => 'blob:http://localhost/mock-blob');
  }
  
  import '@testing-library/jest-dom';
  import 'jest-canvas-mock';
