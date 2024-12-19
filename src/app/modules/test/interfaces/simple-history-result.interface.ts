import { IDetailedHistoryResultItem } from "./detailed-history-result-item.interface"

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

export interface ISimpleHistoryResult {
  measurementDate: string
  measurementServerName: string
  providerName: string
  ipAddress: string
  testUuid?: string
  loopUuid?: string
  isLocal?: boolean
  detailedHistoryResult?: IDetailedHistoryResultItem[]
  paginator?: ISimpleHistoryPaginator
  download?: ISimpleHistoryTestMetric
  upload?: ISimpleHistoryTestMetric
  ping?: ISimpleHistoryTestMetric
  signal?: ISimpleHistoryTestMetric
  locationTable?: ISimpleHistoryTestLocation[]
}
