export type NetworkMeasurementType =
  | "mobile/download"
  | "mobile/upload"
  | "mobile/ping"
  | "mobile/signal"
  | "wifi/download"
  | "wifi/upload"
  | "wifi/ping"
  | "browser/download"
  | "browser/upload"
  | "browser/ping"
  | "all/download"
  | "all/upload"
  | "all/ping"

export interface IMapTypeOption {
  summary: string
  heatmap_captions: string[]
  map_options: NetworkMeasurementType
  unit: string
  heatmap_colors: string[]
  overlay_type: string
  title: string
  classification: string[]
}

export interface IMapType {
  options: IMapTypeOption[]
  title: string
}
