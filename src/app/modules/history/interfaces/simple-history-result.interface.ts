export interface ISimpleHistoryPaginator {
  totalPages: number
  totalElements: number
}

export interface ISimpleHistoryTestMetric {
  classification: number
  value: number
  chart?: any[]
  tags?: string[]
  metric?: string
}

export interface ISimpleHistoryTestLocation {
  lat: number
  loc_accuracy: number
  long: number
  time_elapsed: number
}

export interface ISimpleHistorySignal {
  cat_technology: string
  cell_info_2G: { [key: string]: number } | null
  cell_info_3G: { [key: string]: number } | null
  cell_info_4G: { [key: string]: number } | null
  cell_info_5G: { [key: string]: number } | null
  lte_rsrp: number | null
  lte_rsrq: number | null
  lte_snr: number | null
  network_type: string
  nr_rsrp: number | null
  nr_rsrq: number | null
  nr_snr: number | null
  signal_strength: number
  time_elapsed: number
  timing_advance: number | null
}

export interface ISimpleHistoryResult {
  measurementDate: string
  measurementServerName: string
  providerName: string
  ipAddress: string
  testUuid?: string
  loopUuid?: string
  paginator?: ISimpleHistoryPaginator
  download?: ISimpleHistoryTestMetric
  upload?: ISimpleHistoryTestMetric
  ping?: ISimpleHistoryTestMetric
  signal?: ISimpleHistoryTestMetric
  openTestResponse?: { [key: string]: any }
}
