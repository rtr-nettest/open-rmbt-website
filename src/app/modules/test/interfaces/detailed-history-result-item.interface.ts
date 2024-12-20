export interface IDetailedHistoryResultItem {
  title: string
  value: any
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
