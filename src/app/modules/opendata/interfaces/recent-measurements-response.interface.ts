export interface IRecentMeasurementsResponse {
  next_cursor: number
  duration_ms: number
  results: IRecentMeasurement[]
}

export interface IRecentMeasurement {
  open_uuid: string
  open_test_uuid: string
  time: string
  lat: number
  long: number
  download_kbit: number
  upload_kbit: number
  ping_ms: number
  signal_strength: number
  lte_rsrp: number
  platform: string
  provider_name: string
  model?: string
  loc_accuracy?: number
  download_classification: number
  signal_classification?: number
}

export interface IRecentStats {
  "30min": number
  "5min": number
  "24h": number
  "12h": number
  "60min": number
  "7d": number
}
