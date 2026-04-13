import { IQoeItem } from "./qoe-item.interface"

export interface ICurveItem {
  bytes_total: number
  time_elapsed: number
  speed?: number
}

export interface IPingItem {
  ping_ms: number
  time_elapsed: number
}

export interface IFenceItem {
  fence_id: number
  technology_id?: number
  avg_ping_ms?: number
  technology?: string
  offset_ms?: number
  duration_ms?: number
  radius?: number
  longitude?: number
  latitude?: number
  fence_time?: number
  signal?: number
}

export interface IOpenTestResponse extends Record<string, any> {
  cat_technology?: string
  download_kbit?: number
  ip_anonym?: string
  is_fences?: boolean
  lte_rsrp?: number
  ping_ms?: number
  public_ip_as_name?: string
  qoe_classification?: IQoeItem[]
  server_name?: string
  signal_classification?: number
  signal_strength?: number
  speed_curve?: {
    download: ICurveItem[]
    upload: ICurveItem[]
    ping: IPingItem[]
    fences: IFenceItem[]
    signal?: Record<string, any>[]
  }
  time?: string
  upload_kbit?: number
}
