export interface IHistogramResponse {
  download_kbit: IHistogramResponseItem[] | null
  download_kbit_fine: IHistogramResponseItem[] | null
  ping_ms: IHistogramResponseItem[] | null
  ping_ms_fine: IHistogramResponseItem[] | null
  upload_kbit: IHistogramResponseItem[] | null
  upload_kbit_fine: IHistogramResponseItem[] | null
}

export interface IHistogramResponseItem {
  lower_bound: number
  upper_bound: number
  results: number
}

export type HistogramMetric = "download_kbit" | "upload_kbit" | "ping_ms"
