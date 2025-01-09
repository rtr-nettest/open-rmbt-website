export interface IHistoryRow extends IHistoryGroupItem {
  device?: string
  download?: string
  upload?: string
  ping?: string
  details?: any
  loopUuid?: string
  networkType?: string
  openUuid?: string
  componentField?: string
  parameters?: { [key: string]: any }
}

export interface IHistoryGroupItem {
  id?: string
  measurementDate: string
  count?: number
  groupHeader?: boolean
  hidden?: boolean
}
