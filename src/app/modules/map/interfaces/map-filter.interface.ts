export interface IMapFilterOption {
  statistical_method?: string
  summary?: string
  period: number
  title?: string
  default?: boolean
  provider?: string
  operator?: string
  technology?: string
}

export interface IMapFilter {
  options: IMapFilterOption[]
  title: string
}
