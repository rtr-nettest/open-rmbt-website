import { Component, effect, OnInit } from "@angular/core"
import { FormBuilder, FormControl, FormGroup } from "@angular/forms"
import { ETimeUnit } from "../../constants/time-unit.enum"
import { EPlatform } from "../../constants/platform.enum"
import { EConnectionType } from "../../constants/connection-type.enum"
import { EClientVersion } from "../../constants/client-version.enum"
import { LAND_COVERS } from "../../constants/land-covers"
import { I18nStore } from "../../../i18n/store/i18n.store"
import { OpendataStoreService } from "../../store/opendata-store.service"
import { Router } from "@angular/router"
import { ERoutes } from "../../../shared/constants/routes.enum"
import { searchFromFilters } from "../../../shared/util/search"

type FiltersForm = {
  downloadFrom: FormControl<string | null>
  downloadTo: FormControl<string | null>
  uploadFrom: FormControl<string | null>
  uploadTo: FormControl<string | null>
  pingFrom: FormControl<string | null>
  pingTo: FormControl<string | null>
  signalFrom: FormControl<string | null>
  signalTo: FormControl<string | null>
  locAccuracyFrom: FormControl<string | null>
  locAccuracyTo: FormControl<string | null>
  gkzFrom: FormControl<string | null>
  gkzTo: FormControl<string | null>
  cat_technology: FormControl<EConnectionType | null> // Technology
  model: FormControl<string | null> // Device
  provider_name: FormControl<string | null>
  public_ip_as_name: FormControl<string | null> // Network name (AS)
  timespan: FormControl<number | null>
  timespanUnit: FormControl<ETimeUnit | null>
  timespanEndDate: FormControl<Date | null>
  timespanEndTime: FormControl<Date | null>
  timespanStartDate: FormControl<Date | null>
  timespanStartTime: FormControl<Date | null>
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

@Component({
  selector: "app-filters",
  standalone: true,
  imports: [],
  templateUrl: "./filters.component.html",
  styleUrl: "./filters.component.scss",
})
export class FiltersComponent {
  form?: FormGroup<FiltersForm>
  technologies = Object.entries(EConnectionType)
  timeUnits = Object.entries(ETimeUnit)
  platforms = Object.entries(EPlatform)
  clientVersions = Object.entries(EClientVersion)
  landCovers = LAND_COVERS.map((landCover) => [
    this.i18nStore.translate(`corine_${landCover}`),
    landCover,
  ])

  constructor(
    private readonly fb: FormBuilder,
    private readonly i18nStore: I18nStore,
    private readonly store: OpendataStoreService,
    private readonly router: Router
  ) {
    effect(() => {
      const filters = this.store.filters()
      this.form = this.fb.group({
        downloadFrom: new FormControl(
          filters.download_kbit?.[0]?.slice(1) || null
        ),
        downloadTo: new FormControl(
          filters.download_kbit?.[1]?.slice(1) || null
        ),
        uploadFrom: new FormControl(filters.upload_kbit?.[0]?.slice(1) || null),
        uploadTo: new FormControl(filters.upload_kbit?.[1]?.slice(1) || null),
        pingFrom: new FormControl(filters.ping_ms?.[0]?.slice(1) || null),
        pingTo: new FormControl(filters.ping_ms?.[1]?.slice(1) || null),
        signalFrom: new FormControl(
          filters.signal_strength?.[0]?.slice(1) || null
        ),
        signalTo: new FormControl(
          filters.signal_strength?.[1]?.slice(1) || null
        ),
        locAccuracyFrom: new FormControl(
          filters.loc_accuracy?.[0]?.slice(1) || null
        ),
        locAccuracyTo: new FormControl(
          filters.loc_accuracy?.[1]?.slice(1) || null
        ),
        gkzFrom: new FormControl(filters.gkz?.[0]?.slice(1) || null),
        gkzTo: new FormControl(filters.gkz?.[1]?.slice(1) || null),
        cat_technology: new FormControl(
          (filters.cat_technology as EConnectionType) || null
        ),
        model: new FormControl(filters.model || null),
        provider_name: new FormControl(filters.provider_name || null),
        public_ip_as_name: new FormControl(filters.public_ip_as_name || null),
        timespan: new FormControl(
          0
          // TODO: parse from filters
        ),
        timespanUnit: new FormControl(
          ETimeUnit.DAYS
          // TODO: parse from filters
        ),
        timespanEndDate: new FormControl(
          new Date()
          // TODO: parse from filters
        ),
        timespanEndTime: new FormControl(
          new Date()
          // TODO: parse from filters
        ),
        timespanStartDate: new FormControl(
          new Date()
          // TODO: parse from filters
        ),
        timespanStartTime: new FormControl(
          new Date()
          // TODO: parse from filters
        ),
        platform: new FormControl((filters.platform as EPlatform) || null),
        client_version: new FormControl(
          (filters.client_version as EClientVersion) || null
        ),
        land_cover: new FormControl(filters.land_cover || null),
        network_name: new FormControl(filters.network_name || null),
        network_country: new FormControl(filters.network_country || null),
        country_geoip: new FormControl(filters.country_geoip || null),
        country_location: new FormControl(filters.country_location || null),
        sim_country: new FormControl(filters.sim_country || null),
        sim_mcc_mnc: new FormControl(filters.sim_mcc_mnc || null),
        asn: new FormControl(filters.asn || null),
        cell_area_code: new FormControl(filters.cell_area_code || null),
        cell_location_id: new FormControl(filters.cell_location_id || null),
        radio_band: new FormControl(filters.radio_band || null),
        open_uuid: new FormControl(filters.open_uuid || null),
        client_uuid: new FormControl(filters.client_uuid || null),
        pinned: new FormControl<boolean | null>(filters.pinned || null),
      })
    })
  }

  applyFilters() {
    if (this.form?.value)
      this.router.navigate([this.i18nStore.activeLang, ERoutes.OPEN_DATA], {
        // queryParams: searchFromFilters(this.form?.value),
      })
  }

  // TODO: convert to and from <100
}
