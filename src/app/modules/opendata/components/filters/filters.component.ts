import { Component, effect, inject, signal } from "@angular/core"
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from "@angular/forms"
import { ETimeUnit } from "../../constants/time-unit.enum"
import { EPlatform } from "../../constants/platform.enum"
import { EConnectionType } from "../../constants/connection-type.enum"
import { EClientVersion } from "../../constants/client-version.enum"
import { LAND_COVERS } from "../../constants/land-covers"
import { I18nStore } from "../../../i18n/store/i18n.store"
import { OpendataStoreService } from "../../store/opendata-store.service"
import { Router } from "@angular/router"
import { MatInputModule } from "@angular/material/input"
import { MatSelectModule } from "@angular/material/select"
import { MatButtonModule } from "@angular/material/button"
import { MatOptionModule } from "@angular/material/core"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { COUNTRIES } from "../../../shared/constants/countries"
import { MatFormFieldModule } from "@angular/material/form-field"
import { MatDatepickerModule } from "@angular/material/datepicker"
import { OpendataService } from "../../services/opendata.service"
import { NgFor } from "@angular/common"

type FiltersForm = {
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

class Range {
  constructor(
    public readonly from: string,
    public readonly to: string,
    public readonly unit: string,
    public readonly min: number = 0
  ) {}
}

@Component({
  selector: "app-filters",
  standalone: true,
  imports: [
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatOptionModule,
    MatSelectModule,
    NgFor,
    ReactiveFormsModule,
    TranslatePipe,
  ],
  templateUrl: "./filters.component.html",
  styleUrl: "./filters.component.scss",
})
export class FiltersComponent {
  form?: FormGroup<FiltersForm>
  service = inject(OpendataService)
  visibleFields = signal(
    new Set([
      "download_kbit_from",
      "download_kbit_to",
      "upload_kbit_from",
      "upload_kbit_to",
      "ping_ms_from",
      "ping_ms_to",
      "signal_strength_from",
      "signal_strength_to",
      "loc_accuracy_from",
      "loc_accuracy_to",
      "gkz_from",
      "gkz_to",
      "cat_technology",
      "model",
      "provider_name",
      "public_ip_as_name",
      "timespan",
      "timespan_unit",
      "time_from",
      "time_to",
    ])
  )
  ranges = new Map([
    [
      "download_kbit_from",
      new Range("download_kbit_from", "download_kbit_to", "Mbps"),
    ],
    [
      "upload_kbit_from",
      new Range("upload_kbit_from", "upload_kbit_to", "Mbps"),
    ],
    ["ping_ms_from", new Range("ping_ms_from", "ping_ms_to", "millis")],
    [
      "signal_strength_from",
      new Range("signal_strength_from", "signal_strength_to", "dBm", -120),
    ],
    [
      "loc_accuracy_from",
      new Range("loc_accuracy_from", "loc_accuracy_to", "m"),
    ],
    ["gkz_from", new Range("gkz_from", "gkz_to", "")],
  ])
  selects = new Map([
    ["cat_technology", Object.entries(EConnectionType)],
    ["platform", Object.entries(EPlatform)],
    ["client_version", Object.entries(EClientVersion)],
    [
      "land_cover",
      LAND_COVERS.map((landCover) => [`corine_${landCover}`, landCover]),
    ],
    ["network_country", Object.entries(COUNTRIES)],
    ["country_geoip", Object.entries(COUNTRIES)],
    ["country_location", Object.entries(COUNTRIES)],
    ["sim_country", Object.entries(COUNTRIES)],
  ])
  timeUnits = Object.entries(ETimeUnit)
  pinnedOptions = new Map([
    ["pinned_true", true],
    ["pinned_false", false],
  ])

  get formControlKeys() {
    return Object.keys(this.form?.controls || {})
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly store: OpendataStoreService
  ) {
    effect(() => {
      const filters = this.store.filters()
      this.form = this.fb.group({
        download_kbit_from: new FormControl<string | null>(
          filters.download_kbit_from || null
        ),
        download_kbit_to: new FormControl<string | null>(
          filters.download_kbit_to || null
        ),
        upload_kbit_from: new FormControl<string | null>(
          filters.upload_kbit_from || null
        ),
        upload_kbit_to: new FormControl<string | null>(
          filters.upload_kbit_to || null
        ),
        ping_ms_from: new FormControl<string | null>(
          filters.ping_ms_from || null
        ),
        ping_ms_to: new FormControl<string | null>(filters.ping_ms_to || null),
        signal_strength_from: new FormControl<string | null>(
          filters.signal_strength_from || null
        ),
        signal_strength_to: new FormControl<string | null>(
          filters.signal_strength_to || null
        ),
        loc_accuracy_from: new FormControl<string | null>(
          filters.loc_accuracy_from || null
        ),
        loc_accuracy_to: new FormControl<string | null>(
          filters.loc_accuracy_to || null
        ),
        gkz_from: new FormControl<string | null>(filters.gkz_from || null),
        gkz_to: new FormControl<string | null>(filters.gkz_to || null),
        cat_technology: new FormControl<EConnectionType | null>(
          (filters.cat_technology as EConnectionType) || null
        ),
        model: new FormControl<string | null>(filters.model || null),
        provider_name: new FormControl<string | null>(
          filters.provider_name || null
        ),
        public_ip_as_name: new FormControl<string | null>(
          filters.public_ip_as_name || null
        ),
        timespan: new FormControl<number | null>(filters.timespan || null),
        timespan_unit: new FormControl<ETimeUnit | null>(
          (filters.timespan_unit as ETimeUnit) || null
        ),
        time_from: new FormControl<Date | null>(filters.time_from || null),
        time_to: new FormControl<Date | null>(filters.time_to || null),
        platform: new FormControl<EPlatform | null>(
          (filters.platform as EPlatform) || null
        ),
        client_version: new FormControl<EClientVersion | null>(
          (filters.client_version as EClientVersion) || null
        ),
        land_cover: new FormControl<number | null>(filters.land_cover || null),
        network_name: new FormControl<string | null>(
          filters.network_name || null
        ),
        network_country: new FormControl<string | null>(
          filters.network_country || null
        ),
        country_geoip: new FormControl<string | null>(
          filters.country_geoip || null
        ),
        country_location: new FormControl<string | null>(
          filters.country_location || null
        ),
        sim_country: new FormControl<string | null>(
          filters.sim_country || null
        ),
        sim_mcc_mnc: new FormControl<string | null>(
          filters.sim_mcc_mnc || null
        ),
        asn: new FormControl<number | null>(filters.asn || null),
        cell_area_code: new FormControl<number | null>(
          filters.cell_area_code || null
        ),
        cell_location_id: new FormControl<number | null>(
          filters.cell_location_id || null
        ),
        radio_band: new FormControl<number | null>(filters.radio_band || null),
        open_uuid: new FormControl<string | null>(filters.open_uuid || null),
        client_uuid: new FormControl<string | null>(
          filters.client_uuid || null
        ),
        pinned: new FormControl<boolean | null>(filters.pinned || null),
      })
    })
  }

  applyFilters() {
    this.service.applyFilters(this.form?.value)
  }

  resetForm() {
    this.form = this.fb.group({
      download_kbit_from: new FormControl<string | null>(null),
      download_kbit_to: new FormControl<string | null>(null),
      upload_kbit_from: new FormControl<string | null>(null),
      upload_kbit_to: new FormControl<string | null>(null),
      ping_ms_from: new FormControl<string | null>(null),
      ping_ms_to: new FormControl<string | null>(null),
      signal_strength_from: new FormControl<string | null>(null),
      signal_strength_to: new FormControl<string | null>(null),
      loc_accuracy_from: new FormControl<string | null>(null),
      loc_accuracy_to: new FormControl<string | null>(null),
      gkz_from: new FormControl<string | null>(null),
      gkz_to: new FormControl<string | null>(null),
      cat_technology: new FormControl<EConnectionType | null>(null),
      model: new FormControl<string | null>(null),
      provider_name: new FormControl<string | null>(null),
      public_ip_as_name: new FormControl<string | null>(null),
      timespan: new FormControl<number | null>(null),
      timespan_unit: new FormControl<ETimeUnit | null>(null),
      time_from: new FormControl<Date | null>(null),
      time_to: new FormControl<Date | null>(null),
      platform: new FormControl<EPlatform | null>(null),
      client_version: new FormControl<EClientVersion | null>(null),
      land_cover: new FormControl<number | null>(null),
      network_name: new FormControl<string | null>(null),
      network_country: new FormControl<string | null>(null),
      country_geoip: new FormControl<string | null>(null),
      country_location: new FormControl<string | null>(null),
      sim_country: new FormControl<string | null>(null),
      sim_mcc_mnc: new FormControl<string | null>(null),
      asn: new FormControl<number | null>(null),
      cell_area_code: new FormControl<number | null>(null),
      cell_location_id: new FormControl<number | null>(null),
      radio_band: new FormControl<number | null>(null),
      open_uuid: new FormControl<string | null>(null),
      client_uuid: new FormControl<string | null>(null),
      pinned: new FormControl<boolean | null>(null),
    })
  }
}
