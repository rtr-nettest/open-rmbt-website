export interface ICoverageResponse {
  coverages: ICoverage[]
}

export interface ICoverage {
  download_kbit_max?: number
  download_kbit_normal?: number
  last_updated?: string
  operator: string
  raster?: string
  raster_geo_json?: GeoJSON.MultiPolygon
  technology?: string
  upload_kbit_max?: number
  upload_kbit_normal?: number
}
