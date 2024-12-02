import { IMapFilter } from "./map-filter.interface"
import { IMapType } from "./map-type.interface"

export interface IMapInfo {
  mapfilter: {
    mapTypes: IMapType[]
    mapFilters: {
      all: IMapFilter[]
      wifi: IMapFilter[]
      browser: IMapFilter[]
      mobile: IMapFilter[]
    }
  }
}
