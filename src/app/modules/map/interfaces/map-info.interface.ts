import { IMapFilter } from "./map-filter.interface"

export interface IMapInfo {
  map_filters: IMapFilter[]
}

export interface IMapInfoHash {
  [key: string]: IMapFilter
}
