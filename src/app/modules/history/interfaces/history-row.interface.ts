export interface IHistoryRow extends IHistoryGroupItem {
  device?: string
  download?: string
  upload?: string
  ping?: string
  details?: any
  loopUuid?: string
  networkType?: string
  openUuid?: string
  intValues?: Record<string, number>
}

export interface IHistoryGroupItem {
  id?: string
  measurementDate: string
  count?: number
  groupHeader?: string
  hidden?: boolean
}
