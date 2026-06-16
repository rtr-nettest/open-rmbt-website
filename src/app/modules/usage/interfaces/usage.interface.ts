export interface IUsageValue {
  field: string
  value: number
}

export interface IUsageDay {
  day: number
  values: IUsageValue[]
}

export interface IUsageSum {
  field: string
  sum: number
}

export interface IUsageSection {
  sums: IUsageSum[]
  values: IUsageDay[]
}

export interface IUsageReport {
  platforms?: IUsageSection
  platforms_loopmode?: IUsageSection
  usage?: IUsageSection
  versions_ios?: IUsageSection
  versions_android?: IUsageSection
  versions_applet?: IUsageSection
  network_group_names?: IUsageSection
  network_group_types?: IUsageSection
  platforms_qos?: IUsageSection
}

export type TUsageStatistic = keyof IUsageReport
