export interface Data {
  meta?: Meta;
  results: LatestResult[];
  length?: number;
}

export interface Meta {
  found: number;
  license: string;
  limit: number;
  name: string;
  page: number;
  website: string;
}

export interface LatestResult {
  lat: number;
  lon: number;
  uid: number;
  aqi: string; // string from the API, convert to number as needed
  station: {
    name: string;
    time: string;
  };
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Measurement {
  parameter: string;
  value: number;
  lastUpdated: string;
  unit: string;
}

export interface Parameter {
  name: string;
  value: string;
  min: number;
  max: number;
  guideline: number;
}

export type Parameters = string[];

export interface DateType {
  utc: string;
  local: string;
}

export interface Country {
  id: number;
  cities: number;
  code: string;
  count: number;
  firstUpdated: string;
  lastUpdated: string;
  locations: number;
  name: string;
  parameters: Parameters;
  coordinates: {
    lat: number;
    lon: number;
  };
  sources: number;
}
