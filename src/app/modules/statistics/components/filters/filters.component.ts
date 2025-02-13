import { ChangeDetectorRef, Component, inject, OnDestroy } from "@angular/core"
import { FormBuilder, FormControl, ReactiveFormsModule } from "@angular/forms"
import { MatButtonModule } from "@angular/material/button"
import { MatNativeDateModule, MatOptionModule } from "@angular/material/core"
import { MatIconModule } from "@angular/material/icon"
import { MatSelectModule } from "@angular/material/select"
import { StatisticsStoreService } from "../../store/statistics-store.service"
import { map, skipWhile, Subject, Subscription, takeUntil } from "rxjs"
import { StatisticsService } from "../../services/statistics.service"
import { I18nStore } from "../../../i18n/store/i18n.store"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import tz from "dayjs/plugin/timezone"
import { AsyncPipe } from "@angular/common"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { COUNTRIES } from "../../../shared/constants/countries"
import { PROVINCES } from "../../../shared/constants/provinces"
import { StatisticsNetworkType } from "../../interfaces/statistics-request.interface"
import { MatDatepickerModule } from "@angular/material/datepicker"
import { MatFormFieldModule } from "@angular/material/form-field"
import { MatInputModule } from "@angular/material/input"

dayjs.extend(utc)
dayjs.extend(tz)

type FiltersForm = {
  country: FormControl<string | null>
  duration: FormControl<number | null>
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
export class FiltersComponent implements OnDestroy {
  cdr = inject(ChangeDetectorRef)
  countries = Object.entries(COUNTRIES).map(([code, name]) => [
    code.toUpperCase(),
    name,
  ])
  provinces = Object.entries(PROVINCES)
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
  service = inject(StatisticsService)
  store = inject(StatisticsStoreService)
  fb = inject(FormBuilder)
  form$ = this.store.filters$.pipe(
    map((filters) => {
      if (!filters) return null
      this.store.adjustTimePeriods(filters.end_date)
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
            const durationIndex = this.store
              .durations()
              .findIndex((v) => v[0] === next.duration)
            this.store.adjustTimePeriods(next.end_date)
            this.store.filters$.next({
              ...this.store.filters$.value!,
              ...next,
              duration: this.store.durations()[durationIndex][0],
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

  get durations() {
    return this.store.durations()
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
}
