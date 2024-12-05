export type StatisticsNetworkType = "mobile" | "wifi" | "browser"

export interface IStatisticsRequest {
  language: string | null
  timezone: string | null
  type: StatisticsNetworkType | null
  duration: string | null
  quantile: string | null
  network_type_group: string | null
  max_devices: number | null
  location_accuracy: string | null
  country: string | null
  province: string | null
  end_date: string | null
  capabilities: { classification: { count: 4 } } | null
}
