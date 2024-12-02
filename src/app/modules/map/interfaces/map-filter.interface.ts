export interface IMapFilterOption {
  statistical_method?: string
  summary: string
  period: number
  title: string
  default?: boolean
  provider?: string
}

export interface IMapFilter {
  options: IMapFilterOption[]
  title: string
}
