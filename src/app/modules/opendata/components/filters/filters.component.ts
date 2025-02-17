import {
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from "@angular/core"
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
import { OpendataStoreService } from "../../store/opendata-store.service"
import { MatInputModule } from "@angular/material/input"
import { MatSelectModule } from "@angular/material/select"
import { MatButtonModule } from "@angular/material/button"
import { MatOptionModule } from "@angular/material/core"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { COUNTRIES } from "../../../shared/constants/countries"
import { I18nStore } from "../../../i18n/store/i18n.store"
import { MatFormFieldModule } from "@angular/material/form-field"
import { MatDatepickerModule } from "@angular/material/datepicker"
import { OpendataService } from "../../services/opendata.service"
import { NgIf } from "@angular/common"
import { Subject, takeUntil } from "rxjs"
import { Range } from "../../dto/range.dto"
import { RangesFilterComponent } from "../ranges-filter/ranges-filter.component"
import { FiltersForm } from "../../interfaces/filters-form"
import { SelectsFilterComponent } from "../selects-filter/selects-filter.component"
import { InputsFilterComponent } from "../inputs-filter/inputs-filter.component"
import { TimespanFilterComponent } from "../timespan-filter/timespan-filter.component"
import { DateTimeFilterComponent } from "../date-time-filter/date-time-filter.component"
import dayjs from "dayjs"

const DEFAULT_FIELDS = [
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
]

const ALL_FIELDS = [
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
  "time_to",
  "time_from",
  "platform",
  "client_version",
  "land_cover",
  "network_name",
  "network_country",
  "country_geoip",
  "country_location",
  "sim_country",
  "sim_mcc_mnc",
  "asn",
  "cell_area_code",
  "cell_location_id",
  "radio_band",
  "open_uuid",
  "client_uuid",
  "pinned",
]

@Component({
  selector: "app-filters",
  imports: [
    DateTimeFilterComponent,
    InputsFilterComponent,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatOptionModule,
    MatSelectModule,
    NgIf,
    RangesFilterComponent,
    ReactiveFormsModule,
    SelectsFilterComponent,
    TranslatePipe,
    TimespanFilterComponent,
  ],
  templateUrl: "./filters.component.html",
  styleUrl: "./filters.component.scss",
})
export class FiltersComponent implements OnInit, OnDestroy {
  destroyed$ = new Subject<void>()
  form?: FormGroup<FiltersForm>
  maxFromDate = signal(new Date())
  i18nStore = inject(I18nStore)
  service = inject(OpendataService)
  allFieldsAreVisible = signal(false)
  visibleFields = computed(
    () => new Set(this.allFieldsAreVisible() ? ALL_FIELDS : DEFAULT_FIELDS)
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
  countries = Object.keys(COUNTRIES).map((country) => [country, country])
  selects = new Map([
    ["cat_technology", Object.entries(EConnectionType)],
    ["platform", Object.entries(EPlatform)],
    ["client_version", Object.entries(EClientVersion)],
    [
      "land_cover",
      LAND_COVERS.map((landCover) => [
        `${landCover} - ${this.i18nStore.translate(`corine_${landCover}`)}`,
        landCover,
      ]),
    ],
    ["network_country", this.countries],
    ["country_geoip", this.countries],
    ["country_location", this.countries],
    ["sim_country", this.countries],
    [
      "pinned",
      [
        ["pinned_true", "true"],
        ["pinned_false", "false"],
      ],
    ],
  ])
  timeUnits = Object.values(ETimeUnit).map((unit) => [
    unit.slice(0, 1).toUpperCase() + unit.slice(1),
    unit,
  ])

  get formControlKeys() {
    return Object.keys(this.form?.controls || {})
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly store: OpendataStoreService
  ) {}

  ngOnInit() {
    this.initForm()
  }

  ngOnDestroy(): void {
    this.destroyed$.next()
    this.destroyed$.complete()
  }

  initForm() {
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
      time_to: new FormControl<Date | null>(filters.time_to || null),
      time_from: new FormControl<Date | null>(filters.time_from || null),
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
      sim_country: new FormControl<string | null>(filters.sim_country || null),
      sim_mcc_mnc: new FormControl<string | null>(filters.sim_mcc_mnc || null),
      asn: new FormControl<number | null>(filters.asn || null),
      cell_area_code: new FormControl<number | null>(
        filters.cell_area_code || null
      ),
      cell_location_id: new FormControl<number | null>(
        filters.cell_location_id || null
      ),
      radio_band: new FormControl<number | null>(filters.radio_band || null),
      open_uuid: new FormControl<string | null>(filters.open_uuid || null),
      client_uuid: new FormControl<string | null>(filters.client_uuid || null),
      pinned: new FormControl<boolean | null>(filters.pinned || null),
    })

    this.form.controls.time_from.valueChanges
      .pipe(takeUntil(this.destroyed$))
      .subscribe(this.calculateTime)
    this.form.controls.time_to.valueChanges
      .pipe(takeUntil(this.destroyed$))
      .subscribe(this.calculateTime)
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

  showAllFields() {
    this.allFieldsAreVisible.set(true)
  }

  private calculateTime = () => {
    const timespan = this.form?.get("timespan")?.value
    const timespan_unit = this.form?.get("timespan_unit")?.value
    const time_to = this.form?.get("time_to")?.value
    const time_from = this.form?.get("time_from")?.value
    if (timespan && timespan_unit) {
      const diff = dayjs(time_to || new Date()).diff(
        dayjs(time_from),
        timespan_unit as dayjs.ManipulateType
      )
      if (diff !== timespan) {
        this.form?.controls.timespan.setValue(null)
        this.form?.controls.timespan_unit.setValue(null)
      }
    }
    this.maxFromDate.set(time_to || new Date())
  }

  // TODO: Min-max time
}
