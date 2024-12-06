import { Component, inject } from "@angular/core"
import { SeoComponent } from "../../../shared/components/seo/seo.component"
import { StatisticsService } from "../../services/statistics.service"
import { AsyncPipe } from "@angular/common"
import { StatisticsStoreService } from "../../store/statistics-store.service"
import { catchError, Observable, switchMap, tap } from "rxjs"
import { HeaderComponent } from "../../../shared/components/header/header.component"
import { TopNavComponent } from "../../../shared/components/top-nav/top-nav.component"
import { FooterComponent } from "../../../shared/components/footer/footer.component"
import { BreadcrumbsComponent } from "../../../shared/components/breadcrumbs/breadcrumbs.component"
import { FiltersComponent } from "../../components/filters/filters.component"
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner"
import { HtmlWrapperComponent } from "../../../shared/components/html-wrapper/html-wrapper.component"
import { ITableColumn } from "../../../tables/interfaces/table-column.interface"
import { IStatisticsProvider } from "../../interfaces/statistics-response.interface.interface"
import { PercentileComponent } from "../../components/percentile/percentile.component"
import { roundToSignificantDigits } from "../../../shared/util/math"
import { ERoutes } from "../../../shared/constants/routes.enum"
import dayjs from "dayjs"
import { adjustTimePeriod } from "../../../shared/util/time"
import { TableComponent } from "../../../tables/components/table/table.component"
import { ISort } from "../../../tables/interfaces/sort.interface"

@Component({
  selector: "app-statistics-screen",
  standalone: true,
  imports: [
    BreadcrumbsComponent,
    FiltersComponent,
    HeaderComponent,
    HtmlWrapperComponent,
    TopNavComponent,
    FooterComponent,
    MatProgressSpinnerModule,
    AsyncPipe,
    TableComponent,
  ],
  templateUrl: "./statistics-screen.component.html",
  styleUrl: "./statistics-screen.component.scss",
})
export class StatisticsScreenComponent extends SeoComponent {
  loading = false
  progress = 0
  progressInterval?: NodeJS.Timeout
  service = inject(StatisticsService)
  store = inject(StatisticsStoreService)
  statistics$ = this.store.filters$.pipe(
    switchMap((filters) => {
      this.loading = true
      if (globalThis.document) {
        this.progressInterval = setInterval(() => {
          this.progress += 0.02
        }, 100)
      }
      return this.service.getStatistics(filters)
    }),
    tap(() => {
      this.loading = false
      this.progress = 0
      clearInterval(this.progressInterval)
      this.progressInterval = undefined
    }),
    catchError(() => {
      this.loading = false
      return []
    })
  )
  statisticsText$: Observable<string> =
    this.i18nStore.getLocalizedHtml("statistics")
  statisticsColumns: ITableColumn<IStatisticsProvider>[] = [
    {
      header: "Name",
      columnDef: "name",
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
          } = this.store.filters
          let params = "pinned=true"
          if (type == "mobile") {
            params += `&mobile_provider_name=${provider.name}`
            if (
              network_type_group &&
              network_type_group != "all" &&
              network_type_group != "mixed"
            ) {
              params += `&cat_technology=${network_type_group}`
            }
          } else {
            params += `&provider_name=${provider.name}`
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
            const period = [duration]
            adjustTimePeriod(period, endDate)
            const startDate = dayjs(endDate).subtract(
              parseInt(period[0], 10),
              "days"
            )
            params += `&time[]=>${startDate.format("YYYY-MM-DD HH:mm:ss")}`
            params += `&time[]=<${endDate.format("YYYY-MM-DD HH:mm:ss")}`
          }
          return `/${this.i18nStore.activeLang}/${ERoutes.OPEN_DATA}?${params}`
        }
        return `/${this.i18nStore.activeLang}/${ERoutes.OPEN_DATA}`
      },
      justify: "flex-end",
    },
  ]
  statisticsSort: ISort = { active: "quantity", direction: "desc" }
}
