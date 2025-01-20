import { NetworkMeasurementType } from "../constants/network-measurement-type"
import { ETileTypes } from "../constants/tile-type.enum"

export interface IMapFilterOption {
  title: string
  summary: string
  params?: {
    map_options?: NetworkMeasurementType
    overlay_type?: ETileTypes
    technology?: string
    operator?: number
    period?: number
    provider?: number
    statistical_method?: number
  }
  functions?: [
    {
      func_name: string
      func_params: {
        path: string
        type: ETileTypes
        z_index?: number
        tile_size?: number
      }
    }
  ]
  default: boolean
}

export interface IMapFilterType {
  title: string
  options: IMapFilterOption[]
}

export interface IMapFilter {
  icon: string
  options: IMapFilterType[]
  title: string
  functions: [
    {
      func_name: string
      func_params: {
        key: string
      }
    }
  ]
  depends_on: {
    map_type_is_mobile: boolean
  }
  default: boolean
}
