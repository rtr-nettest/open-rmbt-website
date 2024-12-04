export interface IStatisticsRequest {
  language: string
  timezone: string
  type: "mobile" | "wifi" | "browser"
  duration: string
  quantile: string
  network_type_group: string
  max_devices: number
  location_accuracy: string
  country: string
  province: string | null
  end_date: string | null
  capabilities: { classification: { count: 4 } }
}
