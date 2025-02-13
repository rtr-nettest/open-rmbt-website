import { Component, computed, inject, OnInit, signal } from "@angular/core"
import { SeoComponent } from "../../../shared/components/seo/seo.component"
import { StatisticsService } from "../../services/statistics.service"
import { AsyncPipe } from "@angular/common"
import {
  DEFAULT_FILTERS,
  StatisticsStoreService,
} from "../../store/statistics-store.service"
import { catchError, map, Observable, switchMap, tap } from "rxjs"
import { HeaderComponent } from "../../../shared/components/header/header.component"
import { TopNavComponent } from "../../../shared/components/top-nav/top-nav.component"
import { FooterComponent } from "../../../shared/components/footer/footer.component"
import { BreadcrumbsComponent } from "../../../shared/components/breadcrumbs/breadcrumbs.component"
import { FiltersComponent } from "../../components/filters/filters.component"
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner"
import { HtmlWrapperComponent } from "../../../shared/components/html-wrapper/html-wrapper.component"
import { ITableColumn } from "../../../tables/interfaces/table-column.interface"
import {
  IStatisticsDevice,
  IStatisticsProvider,
  IStatisticsResponse,
} from "../../interfaces/statistics-response.interface.interface"
import { PercentileComponent } from "../../components/percentile/percentile.component"
import { ERoutes } from "../../../shared/constants/routes.enum"
import dayjs from "dayjs"
import { adjustTimePeriod } from "../../../shared/util/time"
import { TableComponent } from "../../../tables/components/table/table.component"
import { ISort } from "../../../tables/interfaces/sort.interface"
import { IBasicResponse } from "../../../tables/interfaces/basic-response.interface"
import {
  EPlatform,
  PlatformService,
} from "../../../shared/services/platform.service"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { MatButtonModule } from "@angular/material/button"
import { roundToSignificantDigits } from "../../../shared/util/math"
import { LoadingOverlayComponent } from "../../../shared/components/loading-overlay/loading-overlay.component"

@Component({
    selector: "app-statistics-screen",
    imports: [
        BreadcrumbsComponent,
        FiltersComponent,
        HeaderComponent,
        HtmlWrapperComponent,
        TopNavComponent,
        FooterComponent,
        MatButtonModule,
        LoadingOverlayComponent,
        AsyncPipe,
        TableComponent,
        TranslatePipe,
    ],
    templateUrl: "./statistics-screen.component.html",
    styleUrl: "./statistics-screen.component.scss"
})
export class StatisticsScreenComponent extends SeoComponent implements OnInit {
  footerColumns = ["name", "down", "up", "latency", "count"]
  loading = signal(false)
  progress = 0
  progressInterval?: NodeJS.Timeout
  platform = inject(PlatformService)
  service = inject(StatisticsService)
  store = inject(StatisticsStoreService)
  statistics$!: Observable<IBasicResponse<IStatisticsProvider>>
  devices = signal<IBasicResponse<IStatisticsDevice> | undefined>(undefined)
  devicesCount = signal(10)
  devicesSlice = computed(() => {
    const content = this.devices()?.content.slice(0, this.devicesCount()) ?? []
    return { content, totalElements: content.length }
  })
  statisticsText$: Observable<string> =
    this.i18nStore.getLocalizedHtml("statistics")
  statisticsColumns: ITableColumn<IStatisticsProvider>[] = [
    {
      header: "Name",
      columnDef: "name",
      getNgClass: () => "app-table__footer-title",
    },
    {
      header: "Down (Mbps)",
      columnDef: "down",
      component: PercentileComponent,
      getComponentParameters: (provider) => ({
        red: provider.down_red,
        yellow: provider.down_yellow,
        green: provider.down_green,
        deepGreen: provider.down_ultragreen,
        label: roundToSignificantDigits(provider.quantile_down / 1000),
        provider: provider.name,
        units: "Mbps",
      }),
      justify: "flex-end",
    },
    {
      header: "Up (Mbps)",
      columnDef: "up",
      component: PercentileComponent,
      getComponentParameters: (provider) => ({
        red: provider.up_red,
        yellow: provider.up_yellow,
        green: provider.up_green,
        deepGreen: provider.up_ultragreen,
        label: roundToSignificantDigits(provider.quantile_up / 1000),
        provider: provider.name,
        units: "Mbps",
      }),
      justify: "flex-end",
    },
    {
      header: "Ping (ms)",
      columnDef: "latency",
      component: PercentileComponent,
      getComponentParameters: (provider) => ({
        red: provider.ping_red,
        yellow: provider.ping_yellow,
        green: provider.ping_green,
        deepGreen: provider.ping_ultragreen,
        label: Math.round(provider.quantile_ping / 1e6),
        provider: provider.name,
        units: "millis",
      }),
      justify: "flex-end",
    },
    {
      header: "Quantity",
      columnDef: "count",
      getLink: (provider) => {
        if (this.store.filters) {
          const {
            network_type_group,
            type,
            location_accuracy,
            duration,
            end_date,
            country,
          } = this.store.filters
          let params = "pinned=true"

          if (type == "mobile") {
            if (provider) {
              params += `&mobile_provider_name=${provider.name}`
            }
            if (
              network_type_group &&
              network_type_group != "all" &&
              network_type_group != "mixed"
            ) {
              params += `&cat_technology=${network_type_group}`
            }
          } else {
            if (provider) {
              params += `&provider_name=${provider.name}`
            }
            if (type == "browser") {
              params += `&cat_technology=LAN`
            } else {
              params += `&cat_technology=WLAN`
            }
          }
          if (location_accuracy && location_accuracy != "-1") {
            params += "&loc_accuracy[]=>0"
            params += `&loc_accuracy[]=<${location_accuracy}`
          }
          if (duration) {
            const endDate = end_date
              ? dayjs(end_date).endOf("day").utc()
              : dayjs().utc()
            const period: [number, string] = [duration, ""]
            adjustTimePeriod(period, endDate)
            const startDate = dayjs(endDate).subtract(period[0], "days")
            params += `&time[]=>${startDate.format("YYYY-MM-DD HH:mm:ss")}`
            params += `&time[]=<${endDate.format("YYYY-MM-DD HH:mm:ss")}`
          }
          if (country) {
            params += `&country_geoip=${country.toLowerCase()}`
          }
          return `/${this.i18nStore.activeLang}/${ERoutes.OPEN_DATA}?${params}`
        }
        return `/${this.i18nStore.activeLang}/${ERoutes.OPEN_DATA}`
      },
      justify: "flex-end",
    },
  ]
  statisticsSort: ISort = { active: "quantity", direction: "desc" }
  deviceColumns: ITableColumn<IStatisticsDevice>[] = [
    {
      header: "Name",
      columnDef: "model",
    },
    {
      header: "Down (Mbps)",
      columnDef: "down",
      transformValue: (value) =>
        roundToSignificantDigits(value.quantile_down / 1000),
      justify: "flex-end",
    },
    {
      header: "Up (Mbps)",
      columnDef: "up",
      transformValue: (value) =>
        roundToSignificantDigits(value.quantile_up / 1000),
      justify: "flex-end",
    },
    {
      header: "Ping (ms)",
      columnDef: "latency",
      transformValue: (value) => Math.round(value.quantile_ping / 1e6),
      justify: "flex-end",
    },
    {
      header: "Quantity",
      columnDef: "count",
      getLink: (device) => {
        if (this.store.filters) {
          const {
            country,
            network_type_group,
            type,
            location_accuracy,
            duration,
            end_date,
          } = this.store.filters
          let params = `pinned=true&model=${device.model}`
          if (type == "mobile") {
            params += `&mobile_provider_name=*`
            if (
              network_type_group &&
              network_type_group != "all" &&
              network_type_group != "mixed"
            ) {
              params += `&cat_technology=${network_type_group}`
            }
          } else if (type == "browser") {
            params += `&cat_technology=LAN`
          } else {
            params += `&cat_technology=WLAN`
          }
          if (location_accuracy && location_accuracy != "-1") {
            params += "&loc_accuracy[]=>0"
            params += `&loc_accuracy[]=<${location_accuracy}`
          }
          if (duration) {
            const endDate = end_date
              ? dayjs(end_date).endOf("day").utc()
              : dayjs().utc()
            const period: [number, string] = [duration, ""]
            adjustTimePeriod(period, endDate)
            const startDate = dayjs(endDate).subtract(period[0], "days")
            params += `&time[]=>${startDate.format("YYYY-MM-DD HH:mm:ss")}`
            params += `&time[]=<${endDate.format("YYYY-MM-DD HH:mm:ss")}`
          }

          if (country) {
            params += `&country_geoip=${country.toLowerCase()}`
          }
          return `/${this.i18nStore.activeLang}/${ERoutes.OPEN_DATA}?${params}`
        }
        return `/${this.i18nStore.activeLang}/${ERoutes.OPEN_DATA}`
      },
      justify: "flex-end",
    },
  ]

  ngOnInit(): void {
    this.initForm()
  }

  private initForm() {
    this.service
      .getBrowserData()
      .pipe(
        tap((data) => {
          this.store.adjustTimePeriods()
          this.store.filters$.next({
            ...DEFAULT_FILTERS,
            language: this.i18nStore.activeLang,
            duration: this.store.durations()[2][0],
            country: data.country_geoip,
            location_accuracy: data.country_geoip == "AT" ? "2000" : "-1",
          })
          this.statistics$ = this.store.filters$.pipe(
            switchMap((filters) => {
              this.loading.set(true)
              if (globalThis.document) {
                this.progressInterval = setInterval(() => {
                  this.progress += 0.02
                }, 100)
              }
              return this.service.getStatistics(filters)
            }),
            map((response) => {
              this.loading.set(false)
              this.progress = 0
              clearInterval(this.progressInterval)
              this.progressInterval = undefined
              this.devices.set({
                content: response.devices,
                totalElements: response.devices.length,
              })
              this.statisticsColumns = this.statisticsColumns.map((c) => {
                return {
                  ...c,
                  footer: this.getFooterValueByColumnName(c, response),
                }
              })
              this.devicesCount.set(10)
              return {
                content: response.providers,
                totalElements: response.providers.length,
              }
            }),
            catchError(() => {
              this.loading.set(false)
              return []
            })
          )
        })
      )
      .subscribe()
  }

  private getFooterValueByColumnName(
    col: ITableColumn<IStatisticsProvider>,
    data: IStatisticsResponse
  ) {
    switch (col.columnDef) {
      case "down":
        return roundToSignificantDigits(
          data.providers_sums.quantile_down / 1000
        )
      case "up":
        return roundToSignificantDigits(data.providers_sums.quantile_up / 1000)
      case "latency":
        return Math.round(data.providers_sums.quantile_ping / 1e6)
      case "count":
        return data.providers_sums.count
      case "name":
        return this.i18nStore.translate("Total")
      default:
        return undefined
    }
  }
}
