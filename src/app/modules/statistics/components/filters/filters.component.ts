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
  province: FormControl<string | null>
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
  countries = Object.entries(COUNTRIES)
  provinces = Object.entries(PROVINCES)
  i18nStore = inject(I18nStore)
  platform = inject(PlatformService)
  service = inject(StatisticsService)
  store = inject(StatisticsStoreService)
  fb = inject(FormBuilder)
  form$ = this.store.filters$.pipe(
    map((filters) => {
      if (!filters) return null
      const form = this.fb.group<FiltersForm>({
        country: new FormControl(filters.country),
        duration: new FormControl(filters.duration),
        type: new FormControl(filters.type),
        quantile: new FormControl(filters.quantile),
        location_accuracy: new FormControl(filters.location_accuracy),
        end_date: new FormControl(filters.end_date),
        province: new FormControl({
          value: filters.province,
          disabled: filters.country !== "AT",
        }),
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
            country: data.country_geoip.toLowerCase(),
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
}
