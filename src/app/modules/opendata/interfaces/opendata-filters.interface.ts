// ref: https://github.com/rtr-nettest/open-rmbt-statistics/blob/master/src/main/java/at/rtr/rmbt/controller/OpenTestController.java

export interface IOpendataFilters {
  download_kbit?: string[] // ">6903"
  upload_kbit?: string[] // "<4670"
  ping_ms?: string[] // "<16"
  signal_strength?: string[] // ">-70"
  loc_accuracy?: string[] // "<100"
  gkz?: string[]
  gkz_sa?: string
  cat_technology?: string
  client_version?: string
  model?: string
  network_name?: string
  network_type?: string
  platform?: string
  lte_rsrp?: string
  open_uuid?: string
  open_test_uuid?: string
  client_uuid?: string
  loop_uuid?: string
  test_uuid?: string
  long?: number
  lat?: number
  radius?: string
  mobile_provider_name?: string
  provider_name?: string
  sim_mcc_mnc?: string
  sim_country?: string
  network_country?: string
  country_geoip?: string
  country_location?: string
  user_server_selection?: boolean
  link_name?: string
  public_ip_as_name?: string
  time?: string
  radio_band?: number
  cell_area_code?: number
  cell_location_id?: number
  additional_info?: string[]
  format?: string
  sort_by?: string
  sort_order?: string
  max_results?: number
  cursor?: number
  sender?: string
  timestamp?: string
  asn?: number
  land_cover?: number
  implausible?: boolean
  pinned?: boolean
}
