import {
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from "@angular/core"
import { FormBuilder, FormControl, ReactiveFormsModule } from "@angular/forms"
import { MatButtonModule } from "@angular/material/button"
import { MatNativeDateModule, MatOptionModule } from "@angular/material/core"
import { MatIconModule } from "@angular/material/icon"
import { MatSelectModule } from "@angular/material/select"
import { StatisticsStoreService } from "../../store/statistics-store.service"
import {
  debounce,
  debounceTime,
  filter,
  map,
  pairwise,
  skipWhile,
  Subject,
  Subscription,
  takeUntil,
  tap,
} from "rxjs"
import {
  EPlatform,
  PlatformService,
} from "../../../shared/services/platform.service"
import { StatisticsService } from "../../services/statistics.service"
import { I18nStore } from "../../../i18n/store/i18n.store"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import tz from "dayjs/plugin/timezone"
import { AsyncPipe } from "@angular/common"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { COUNTRIES } from "../../constants/countries"
import { PROVINCES } from "../../constants/provinces"
import { StatisticsNetworkType } from "../../interfaces/statistics-request.interface"
import { MatDatepickerModule } from "@angular/material/datepicker"
import { MatFormFieldModule } from "@angular/material/form-field"
import { MatInputModule } from "@angular/material/input"
import { adjustTimePeriod } from "../../../shared/util/time"

dayjs.extend(utc)
dayjs.extend(tz)

type FiltersForm = {
  country: FormControl<string | null>
  duration: FormControl<string | null>
  type: FormControl<StatisticsNetworkType | null>
  quantile: FormControl<string | null>
  location_accuracy: FormControl<string | null>
  end_date: FormControl<string | null>
  province: FormControl<number | null>
  network_type_group: FormControl<string | null>
}

@Component({
  selector: "app-filters",
  standalone: true,
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
    MatSelectModule,
    MatIconModule,
    MatOptionModule,
    TranslatePipe,
  ],
  templateUrl: "./filters.component.html",
  styleUrl: "./filters.component.scss",
})
export class FiltersComponent implements OnInit, OnDestroy {
  cdr = inject(ChangeDetectorRef)
  countries = Object.entries(COUNTRIES).map(([code, name]) => [
    code.toUpperCase(),
    name,
  ])
  provinces = Object.entries(PROVINCES)
  durations = [
    ["1", "24 hours"],
    ["7", "1 week"],
    ["30", "1 month"],
    ["90", "3 months"],
    ["180", "6 months"],
    ["365", "1 year"],
    ["730", "2 years"],
    ["1095", "3 years"],
    ["1460", "4 years"],
    ["2920", "8 years"],
  ]
  tecnologies = [
    ["all", "All"],
    ["2G", "2G"],
    ["3G", "3G"],
    ["4G", "4G"],
    ["5G", "5G"],
    ["mixed", "Mixed"],
  ]
  quantiles = [
    ["0.2", "20%"],
    ["0.5", "50%"],
    ["0.8", "80%"],
  ]
  locationAccuracies = [
    ["-1", "Any"],
    ["10000", "< 10 km"],
    ["2000", "< 2 km"],
    ["100", "< 100 m"],
  ]
  i18nStore = inject(I18nStore)
  platform = inject(PlatformService)
  service = inject(StatisticsService)
  store = inject(StatisticsStoreService)
  fb = inject(FormBuilder)
  form$ = this.store.filters$.pipe(
    map((filters) => {
      if (!filters) return null
      this.adjustTimePeriods(filters.end_date)
      const form = this.fb.group<FiltersForm>({
        country: new FormControl(filters.country),
        duration: new FormControl(filters.duration),
        type: new FormControl(filters.type),
        quantile: new FormControl(filters.quantile),
        location_accuracy: new FormControl(filters.location_accuracy),
        end_date: new FormControl(filters.end_date),
        province: new FormControl(filters.province),
        network_type_group: new FormControl(filters.network_type_group),
      })
      this.subscription?.unsubscribe()
      this.subscription = form.valueChanges
        .pipe(
          takeUntil(this.destroyed$),
          skipWhile(() => form.controls.end_date.invalid)
        )
        .subscribe((next) => {
          if (next.end_date !== this.store.filters$.value?.end_date) {
            const durationIndex = this.durations.findIndex(
              (v) => v[0] === next.duration
            )
            this.adjustTimePeriods(next.end_date)
            this.store.filters$.next({
              ...this.store.filters$.value!,
              ...next,
              duration: this.durations[durationIndex][0],
            })
            return
          }
          this.store.filters$.next({
            ...this.store.filters$.value!,
            ...next,
          })
        })
      return form
    })
  )
  showMore = false
  destroyed$ = new Subject<void>()
  subscription?: Subscription
  dateSubscription?: Subscription

  ngOnInit(): void {
    this.initForm()
  }

  ngOnDestroy(): void {
    this.destroyed$.next()
    this.destroyed$.complete()
  }

  changeType(type: StatisticsNetworkType) {
    this.store.filters$.next({
      ...this.store.filters$.value!,
      type,
    })
  }

  setShowMore() {
    this.showMore = !this.showMore
    this.cdr.detectChanges()
  }

  private initForm() {
    this.service
      .getBrowserData()
      .pipe(
        tap((data) => {
          const p = this.platform.detectPlatform()
          this.store.filters$.next({
            language: this.i18nStore.activeLang,
            type: new Set([
              EPlatform.WIN_PHONE,
              EPlatform.ANDROID,
              EPlatform.IOS,
            ]).has(p)
              ? "mobile"
              : "browser",
            country: data.country_geoip,
            duration: "30",
            province: null,
            end_date: null,
            quantile: "0.5",
            location_accuracy: data.country_geoip == "AT" ? "2000" : "-1",
            network_type_group: "all",
            max_devices: 100,
            capabilities: { classification: { count: 4 } },
            timezone: dayjs.tz.guess(),
          })
        })
      )
      .subscribe()
  }

  /**
   * Adjust time periods to represent calendar dates (e.g. 1 month should be 28-31 days)
   */
  private adjustTimePeriods(endDateString?: string | null) {
    let enddate = endDateString ? dayjs(endDateString).utc() : dayjs().utc()
    for (const option of this.durations) {
      adjustTimePeriod(option, enddate)
    }
  }
}
