type data = {
    meta?: meta,
    results: results
    length?: number
  }

  type meta = {
    found: number,
    license: string,
    limit: number,
    name: string,
    page: number,
    website: URL,  
  }

  type results = [{
    average?: number,
    displayName?: string,
    id?: number,
    measurement_count?: number,
    month?: string,
    name?: string,
    parameter?: string,
    parameterId?: number,
    subtitle?: string,
    unit?: string,
    coordinates?: {latitude: number, longitude: number}
    city?: null,
    country?: string,
    entity?: string,
    firstUpdated?: string,
    id?: number,
    isAnalysis?: boolean,
    isMobile?: boolean,
    lastUpdated?: string,
    measurements?: number,
    name?: string,
    parameters?: parameters,
    location?: string,
    locationId?: number,
    parameter?: any,
    sensorType?: string,
    sources?: any
  }, length?: number | null]

  type coordinates = {
    latitude: number,
    longitute: number
  }

  type date = {
    utc: date,
    local: date
  }

  type countries = {
    cities: string,
    code: string,
    count: number,
    firstUpdated: number,
    localUpdated: number,
    locations: number,
    name: string,
    parameters: parameters,
    sources: number
  }

  type parameter = { name: string, 
                  value: string }

  type parameters = [
   string
  ]