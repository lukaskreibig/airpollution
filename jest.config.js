module.exports = {
    testEnvironment: "jsdom",
    setupFilesAfterEnv: ["<rootDir>/setupTests.js"],
    moduleNameMapper: {
        "^mapbox-gl$": "<rootDir>/src/__mocks__/mapbox-gl.js",
    }
  };