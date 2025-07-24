export interface IDetailedHistoryResultItem {
  title: string
  value: any
  searchable?: boolean
  searchTerm?: string | null | string[]
  mappable?: boolean
  mapProps?: {
    coordinates: [number, number]
    loc_accuracy?: number
    distance?: number
  }
  initial?: boolean
}
