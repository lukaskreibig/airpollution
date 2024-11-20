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
  location: string;
  city: string | null;
  country: string;
  coordinates: Coordinates;
  measurements: Measurement[];
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
  cities: number;
  code: string;
  count: number;
  firstUpdated: string;
  lastUpdated: string;
  locations: number;
  name: string;
  parameters: Parameters;
  sources: number;
}
