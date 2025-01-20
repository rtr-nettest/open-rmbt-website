export type StatisticsNetworkType = "mobile" | "wifi" | "browser"

export interface IStatisticsRequest {
  language: string | null
  timezone: string | null
  type: StatisticsNetworkType | null
  duration: number | null
  quantile: string | null
  network_type_group: string | null
  max_devices: number | null
  location_accuracy: string | null
  country: string | null
  province: number | null
  end_date: string | null
  capabilities: { classification: { count: 4 } } | null
}
