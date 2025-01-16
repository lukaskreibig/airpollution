/**
 * @file chartUtilsHelpers.test.ts
 * @desc Simple tests for the helper functions: aqiColor, isValidMeasurement, etc.
 */

import { aqiColor, isValidMeasurement } from '../chartUtilsHelpers';

describe('chartUtilsHelpers', () => {
  describe('aqiColor', () => {
    it('returns #bfbfbf if aqi < 0', () => {
      expect(aqiColor(-1)).toBe('#bfbfbf');
    });
    it('returns #2a9d8f if aqi <= 50', () => {
      expect(aqiColor(50)).toBe('#2a9d8f');
    });
    it('returns #9d0208 if aqi > 200', () => {
      expect(aqiColor(201)).toBe('#9d0208');
    });
  });

  describe('isValidMeasurement', () => {
    it('rejects non-AQI parameter', () => {
      expect(isValidMeasurement('foo', 100)).toBe(false);
    });
    it('rejects negative or zero values', () => {
      expect(isValidMeasurement('pm25', 0)).toBe(false);
    });
    it('accepts pm25 value=50', () => {
      expect(isValidMeasurement('pm25', 50)).toBe(true);
    });
    it('rejects value above 600 for pm25', () => {
      expect(isValidMeasurement('pm25', 700)).toBe(false);
    });
  });
});
