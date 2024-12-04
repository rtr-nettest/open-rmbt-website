export interface IBrowserData {
  country_geoip: string
  ip: string
  port: number
  product: string
  version: string
  category: string
  os: string
  agent: string
  url: string
  languages: string[]
  headers: { [key: string]: string }
}
