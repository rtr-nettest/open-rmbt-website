import { FormControl } from "@angular/forms"
import { EConnectionType } from "../constants/connection-type.enum"
import { ETimeUnit } from "../constants/time-unit.enum"
import { EPlatform } from "../constants/platform.enum"
import { EClientVersion } from "../constants/client-version.enum"

export type FiltersForm = {
  download_kbit_from: FormControl<string | null>
  download_kbit_to: FormControl<string | null>
  upload_kbit_from: FormControl<string | null>
  upload_kbit_to: FormControl<string | null>
  ping_ms_from: FormControl<string | null>
  ping_ms_to: FormControl<string | null>
  signal_strength_from: FormControl<string | null>
  signal_strength_to: FormControl<string | null>
  loc_accuracy_from: FormControl<string | null>
  loc_accuracy_to: FormControl<string | null>
  gkz_from: FormControl<string | null>
  gkz_to: FormControl<string | null>
  cat_technology: FormControl<EConnectionType | null> // Technology
  model: FormControl<string | null> // Device
  provider_name: FormControl<string | null>
  public_ip_as_name: FormControl<string | null> // Network name (AS)
  timespan: FormControl<number | null>
  timespan_unit: FormControl<ETimeUnit | null>
  time_to: FormControl<Date | null>
  time_from: FormControl<Date | null>
  platform: FormControl<EPlatform | null>
  client_version: FormControl<EClientVersion | null> // Software version
  land_cover: FormControl<number | null>
  network_name: FormControl<string | null> // Mobile network (Display)
  network_country: FormControl<string | null> // Country
  country_geoip: FormControl<string | null> // Country (IP)
  country_location: FormControl<string | null>
  sim_country: FormControl<string | null>
  sim_mcc_mnc: FormControl<string | null>
  asn: FormControl<number | null>
  cell_area_code: FormControl<number | null>
  cell_location_id: FormControl<number | null>
  radio_band: FormControl<number | null>
  open_uuid: FormControl<string | null>
  client_uuid: FormControl<string | null>
  pinned: FormControl<boolean | null>
}
