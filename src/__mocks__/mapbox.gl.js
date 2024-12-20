module.exports = {
    Map: function () {
      return {
        on: jest.fn(),
        remove: jest.fn(),
        addControl: jest.fn(),
        dragPan: { enable: jest.fn() },
        addSource: jest.fn(),
        addLayer: jest.fn(),
        fitBounds: jest.fn(),
        flyTo: jest.fn(),
        resize: jest.fn(),
        isStyleLoaded: jest.fn().mockReturnValue(true),
        getSource: jest.fn().mockReturnValue({ setData: jest.fn() }),
        getCanvas: jest.fn().mockReturnValue({ style: {} }),
      };
    },
  };
  