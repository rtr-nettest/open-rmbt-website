export interface IDetailedHistoryResultItem {
  title: string
  value: string
  searchable?: boolean
  searchTerm?: string | null | string[]
  mappable?: boolean
  coordinates?: [number, number]
  initial?: boolean
}
