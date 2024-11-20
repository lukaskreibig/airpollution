// Existing types with minimal adjustments

type data = {
  meta?: meta;
  results: results;
  length?: number;
};

type meta = {
  found: number;
  license: string;
  limit: number;
  name: string;
  page: number;
  website: string;
};

type results = LatestResult[];

type LatestResult = {
  location: string;
  city: string | null;
  country: string;
  coordinates: Coordinates;
  measurements: Measurement[];
};

type Coordinates = {
  latitude: number;
  longitude: number;
};

type Measurement = {
  parameter: string;
  value: number;
  lastUpdated: string;
  unit: string;
};

type parameter = {
  name: string;
  value: string;
};

type parameters = string[];

type date = {
  utc: string;
  local: string;
};

type countries = {
  cities: string;
  code: string;
  count: number;
  firstUpdated: string;
  lastUpdated: string;
  locations: number;
  name: string;
  parameters: parameters;
  sources: number;
};
