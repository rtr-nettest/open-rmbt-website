export interface IDetailedHistoryResultItem {
  title: string
  value: string
  searchable?: boolean
  searchTerm?: string | null | string[]
  mappable?: boolean
  mapProps?: {
    coordinates: [number, number]
    accuracy?: number
    distance?: number
  }
  initial?: boolean
}
