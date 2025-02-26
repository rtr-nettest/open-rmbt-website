import { NetworkMeasurementType } from "../constants/network-measurement-type"

export interface IMarkerRequest {
  capabilities: {
    classification: { count: number }
  }
  coords: { x: number; y: number; z: number }
  filter: {
    statistical_method?: number | null
    period?: number | null
    provider?: string | number | null
    operator?: string | number | null
    technology?: string | null
    highlight?: string | null // Open UUID
  }
  language: string
  options: { map_options: NetworkMeasurementType }
}
