import { Component, inject, OnInit } from "@angular/core"
import { SeoComponent } from "../../../shared/components/seo/seo.component"
import { StatisticsService } from "../../services/statistics.service"
import { AsyncPipe } from "@angular/common"
import { StatisticsStoreService } from "../../store/statistics-store.service"
import { switchMap, tap } from "rxjs"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import tz from "dayjs/plugin/timezone"
import {
  EPlatform,
  PlatformService,
} from "../../../shared/services/platform.service"

dayjs.extend(utc)
dayjs.extend(tz)

@Component({
  selector: "app-statistics-screen",
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: "./statistics-screen.component.html",
  styleUrl: "./statistics-screen.component.scss",
})
export class StatisticsScreenComponent extends SeoComponent implements OnInit {
  platform = inject(PlatformService)
  service = inject(StatisticsService)
  store = inject(StatisticsStoreService)
  browserData$ = this.service.getBrowserData()
  statistics$ = this.store.filters$.pipe(
    switchMap((filters) => this.service.getStatistics(filters))
  )

  ngOnInit(): void {
    this.browserData$
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
}
