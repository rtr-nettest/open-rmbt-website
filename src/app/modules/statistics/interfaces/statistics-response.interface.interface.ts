import { StatisticsNetworkType } from "./statistics-request.interface"

export interface IStatisticsResponse {
  duration: number
  devices: IStatisticsDevice[]
  quantile: number
  devices_sums: IStatisticsDevice
  countries: string[]
  type: StatisticsNetworkType
  providers_sums: IStatisticsProvider
  providers: IStatisticsProvider[]
}

export interface IStatisticsDevice {
  quantile_ping: number
  count: number
  quantile_up: number
  model: string
  quantile_down: number
}

export interface IStatisticsProvider {
  name: string
  down_red: number
  ping_green: number
  up_ultragreen: number
  count: number
  quantile_up: number
  up_yellow: number
  up_red: number
  down_ultragreen: number
  down_green: number
  quantile_ping: number
  down_yellow: number
  ping_ultragreen: number
  ping_yellow: number
  ping_red: number
  quantile_down: number
  up_green: number
}
