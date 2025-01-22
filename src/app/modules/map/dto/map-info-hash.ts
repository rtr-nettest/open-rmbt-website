import { IMapFilter } from "../interfaces/map-filter.interface"
import { IMapInfo, IMapInfoHash } from "../interfaces/map-info.interface"

export class MapInfoHash {
  private hash: IMapInfoHash
  constructor(mapInfo: IMapInfo) {
    this.hash = mapInfo.map_filters.reduce((acc, filter) => {
      if (
        filter.icon === "MAP_FILTER_CARRIER" &&
        !filter.depends_on?.map_type_is_mobile
      ) {
        acc["PROVIDER"] = filter
      } else if (!filter.icon) {
        if (
          filter.options?.findIndex(
            (option) => option.params?.statistical_method
          ) !== -1
        )
          acc["STATISTICS"] = filter
      } else {
        acc[filter.icon] = filter
      }
      return acc
    }, {} as IMapInfoHash)
  }

  get(key: MapInfoHashKey): IMapFilter {
    return this.hash[key]
  }

  set(key: MapInfoHashKey, value: IMapFilter): void {
    this.hash[key] = value
  }

  getDefaultValueOf(key: MapInfoHashKey) {
    return this.hash[key].options?.find((option) => option.default)?.params
  }
}

export type MapInfoHashKey =
  | "MAP_TYPE"
  | "MAP_FILTER_TECHNOLOGY"
  | "MAP_FILTER_CARRIER"
  | "PROVIDER"
  | "OVERLAY_TYPE"
  | "MAP_FILTER_PERIOD"
  | "MAP_APPEARANCE"
  | "STATISTICS"
