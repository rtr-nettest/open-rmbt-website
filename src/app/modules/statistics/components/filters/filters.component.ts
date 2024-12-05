import { Component, inject, OnInit } from "@angular/core"
import { FormBuilder, FormControl, ReactiveFormsModule } from "@angular/forms"
import { MatButtonModule } from "@angular/material/button"
import { MatNativeDateModule, MatOptionModule } from "@angular/material/core"
import { MatIconModule } from "@angular/material/icon"
import { MatSelectModule } from "@angular/material/select"
import { StatisticsStoreService } from "../../store/statistics-store.service"
import { map, Observable, tap } from "rxjs"
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
}

@Component({
  selector: "app-filters",
  standalone: true,
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatNativeDateModule,
    MatSelectModule,
    MatIconModule,
    MatOptionModule,
    TranslatePipe,
  ],
  templateUrl: "./filters.component.html",
  styleUrl: "./filters.component.scss",
})
export class FiltersComponent implements OnInit {
  countries = Object.entries(COUNTRIES).map(([code, name]) => [
    code.toUpperCase(),
    name,
  ])
  provinces = Object.entries(PROVINCES)
  durationOptions = [
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
  i18nStore = inject(I18nStore)
  platform = inject(PlatformService)
  service = inject(StatisticsService)
  store = inject(StatisticsStoreService)
  fb = inject(FormBuilder)
  form$ = this.store.filters$.pipe(
    map((filters) => {
      if (!filters) return null
      this.adjustTimePeriods()
      const form = this.fb.group<FiltersForm>({
        country: new FormControl(filters.country),
        duration: new FormControl(filters.duration),
        type: new FormControl(filters.type),
        quantile: new FormControl(filters.quantile),
        location_accuracy: new FormControl(filters.location_accuracy),
        end_date: new FormControl(filters.end_date),
        province: new FormControl(filters.province),
      })
      form.valueChanges.subscribe((value) => {
        this.store.filters$.next({
          ...this.store.filters$.value!,
          ...value!,
        })
      })
      return form
    })
  )

  ngOnInit(): void {
    this.initForm()
  }

  changeType(type: StatisticsNetworkType) {
    this.store.filters$.next({
      ...this.store.filters$.value!,
      type,
    })
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
            province: 0,
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
    let enddate = endDateString ? dayjs(endDateString) : dayjs()
    for (const option of this.durationOptions) {
      const val = parseInt(option[0], 10)
      const spans = [
        {
          count: 30,
          unit: "months" as const,
        },
        {
          count: 365,
          unit: "years" as const,
        },
      ]
      for (let i = 0; i < spans.length; i++) {
        const timespan = spans[i]
        if (val > 7 && val % timespan.count <= 6) {
          var units = Math.round(val / timespan.count)
          var then = dayjs(enddate).subtract(units, timespan.unit)

          //if the end of a month is selected - then should also be the end of a month!
          if (
            timespan.unit === "months" &&
            dayjs(enddate).format("YYYY-MM-DD") ===
              dayjs(enddate).endOf("month").format("YYYY-MM-DD")
          ) {
            then = then.endOf("month").startOf("day")
          }

          option[0] = dayjs(enddate).diff(then, "days").toString()
        }
      }
    }
  }
}
