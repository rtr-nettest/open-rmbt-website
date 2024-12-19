import { Component, signal } from "@angular/core"
import { HeaderComponent } from "../../../shared/components/header/header.component"
import { TopNavComponent } from "../../../shared/components/top-nav/top-nav.component"
import { FooterComponent } from "../../../shared/components/footer/footer.component"
import { ScrollTopComponent } from "../../../shared/components/scroll-top/scroll-top.component"
import { TableComponent } from "../../../tables/components/table/table.component"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { AsyncPipe, DatePipe, NgIf } from "@angular/common"
import { ITableColumn } from "../../../tables/interfaces/table-column.interface"
import { Observable, switchMap, tap } from "rxjs"
import { ERoutes } from "../../../shared/constants/routes.enum"
import {
  ISimpleHistoryResult,
  ISimpleHistorySignal,
  ISimpleHistoryTestLocation,
} from "../../interfaces/simple-history-result.interface"
import { IBasicResponse } from "../../../tables/interfaces/basic-response.interface"
import { IDetailedHistoryResultItem } from "../../interfaces/detailed-history-result-item.interface"
import { ClassificationService } from "../../../shared/services/classification.service"
import { I18nStore } from "../../../i18n/store/i18n.store"
import { ActivatedRoute, Router, RouterModule } from "@angular/router"
import { TestStore } from "../../store/test.store"
import { HistoryExportService } from "../../services/history-export.service"
import { ISort } from "../../../tables/interfaces/sort.interface"
import { TestService } from "../../services/test.service"
import { SimpleHistoryResult } from "../../dto/simple-history-result.dto"
import { IMainMenuItem } from "../../../shared/interfaces/main-menu-item.interface"
import { MainStore } from "../../../shared/store/main.store"
import { TestChartComponent } from "../../components/test-chart/test-chart.component"
import { MatButtonModule } from "@angular/material/button"
import { BreadcrumbsComponent } from "../../../shared/components/breadcrumbs/breadcrumbs.component"
import { roundToSignificantDigits } from "../../../shared/util/math"
import { MapComponent } from "../../components/map/map.component"
import { SeoComponent } from "../../../shared/components/seo/seo.component"
import { Title } from "@angular/platform-browser"
import { SpeedDetailsComponent } from "../../components/speed-details/speed-details.component"
import { IOverallResult } from "../../interfaces/overall-result.interface"
import { IPing } from "../../interfaces/measurement-result.interface"
import { PingDetailsComponent } from "../../components/ping-details/ping-details.component"
import { LocationDetailsComponent } from "../../components/location-details/location-details.component"
import { SignalChartComponent } from "../../components/signal-chart/signal-chart.component"

@Component({
  selector: "app-result-screen",
  standalone: true,
  imports: [
    AsyncPipe,
    DatePipe,
    HeaderComponent,
    LocationDetailsComponent,
    MapComponent,
    MatButtonModule,
    NgIf,
    PingDetailsComponent,
    RouterModule,
    TableComponent,
    TestChartComponent,
    TopNavComponent,
    TranslatePipe,
    FooterComponent,
    ScrollTopComponent,
    SignalChartComponent,
    SpeedDetailsComponent,
    BreadcrumbsComponent,
  ],
  templateUrl: "./result-screen.component.html",
  styleUrl: "./result-screen.component.scss",
})
export class ResultScreenComponent extends SeoComponent {
  columns: ITableColumn[] = [
    {
      columnDef: "title",
      header: "",
      getNgClass: () => "app-cell--30",
    },
    {
      columnDef: "value",
      header: "",
      isHtml: true,
    },
  ]
  error$!: Observable<Error | null>
  result$!: Observable<SimpleHistoryResult | null>
  sort: ISort = {
    active: "",
    direction: "",
  }
  actionButtons: IMainMenuItem[] = [
    {
      label: "Export as PDF",
      icon: "filetype-pdf",
      action: () =>
        this.exporter.exportAsPdf([this.store.simpleHistoryResult$.value!]),
    },
  ]
  mapContainerId = "mapContainer"
  mapParams = signal<URLSearchParams>(new URLSearchParams())
  routes = ERoutes
  showFullDetails = signal<boolean>(false)
  initialDetails = signal<IBasicResponse<IDetailedHistoryResultItem>>(
    this.defaultInitialDetails
  )
  basicResults = signal<IBasicResponse<IDetailedHistoryResultItem> | null>(null)
  detailedResults = signal<IBasicResponse<IDetailedHistoryResultItem> | null>(
    null
  )

  downloadTable = signal<IOverallResult[]>([])
  uploadTable = signal<IOverallResult[]>([])
  pingTable = signal<IPing[]>([])
  locationTable = signal<ISimpleHistoryTestLocation[]>([])
  signalTable = signal<ISimpleHistorySignal[]>([])

  get activeLang() {
    // TODO: signal
    return this.i18nStore.activeLang
  }

  private get defaultInitialDetails() {
    return {
      content: [],
      get totalElements() {
        return this.content.length
      },
    }
  }

  constructor(
    i18nStore: I18nStore,
    title: Title,
    private classification: ClassificationService,
    private exporter: HistoryExportService,
    private mainStore: MainStore,
    private service: TestService,
    private store: TestStore,
    private route: ActivatedRoute
  ) {
    super(title, i18nStore)
    this.result$ = this.i18nStore.getTranslations().pipe(
      switchMap(() =>
        this.service.getMeasurementResult({
          openTestUuid: this.route.snapshot.queryParamMap.get("open_test_uuid"),
          testUuid:
            this.route.snapshot.queryParamMap
              .get("test_uuid")
              ?.replace("T", "") ?? null,
        })
      ),
      tap((result) => {
        if (result) {
          this.basicResults.set(this.getBasicResults(result))
          this.detailedResults.set(this.getDetailedResults(result))
        }
      })
    )
    this.error$ = this.mainStore.error$
  }

  override ngOnDestroy(): void {
    this.destroyed$.next()
    this.destroyed$.complete()
    this.mainStore.error$.next(null)
  }

  getSpeedInMbps(speed: number) {
    const locale = this.i18nStore.activeLang
    return (
      roundToSignificantDigits(speed / 1e3).toLocaleString(locale) +
      " " +
      this.i18nStore.translate("Mbps")
    )
  }

  getPingInMs(ping: number) {
    const locale = this.i18nStore.activeLang
    return (
      Math.round(ping).toLocaleString(locale) +
      " " +
      this.i18nStore.translate("millis")
    )
  }

  private getBasicResults(
    result: ISimpleHistoryResult
  ): IBasicResponse<IDetailedHistoryResultItem> {
    if (result.locationTable) this.locationTable.set(result.locationTable)
    if (result.ping?.chart) this.pingTable.set(result.ping.chart)
    if (result.download?.chart)
      this.downloadTable.set(result.download.chart.slice(1))
    if (result.upload?.chart) this.uploadTable.set(result.upload.chart.slice(1))
    if (result.signal?.chart) this.signalTable.set(result.signal.chart)
    const content = Object.entries(result).reduce((acc, [key, value]) => {
      const t = (key: string) => this.i18nStore.translate(key)
      switch (key) {
        case "download":
          return [
            ...acc,
            {
              title: t("Download"),
              value:
                this.classification.getPhaseIconByClass(
                  "down",
                  result.download?.classification
                ) + this.getSpeedInMbps(value.value),
            },
          ]
        case "upload":
          return [
            ...acc,
            {
              title: t("Upload"),
              value:
                this.classification.getPhaseIconByClass(
                  "up",
                  result.upload?.classification
                ) + this.getSpeedInMbps(value.value),
            },
          ]
        case "ping":
          return [
            ...acc,
            {
              title: t("Ping"),
              value:
                this.classification.getPhaseIconByClass(
                  "ping",
                  result.ping?.classification
                ) + this.getPingInMs(value.value),
            },
          ]
        case "signal":
          if (!result.signal?.value) {
            return acc
          }
          return [
            ...acc,
            {
              title: t(
                result.signal?.tags?.includes("lte_rsrp")
                  ? "lte_rsrp"
                  : "signal_strength"
              ),
              value:
                this.classification.getSignalIconByClass(
                  result.signal.classification,
                  result.signal.metric
                ) +
                result.signal.value +
                " " +
                this.i18nStore.translate("dBm"),
            },
          ]
        default:
          return acc
      }
    }, [] as IDetailedHistoryResultItem[])
    return {
      content,
      totalElements: content.length,
    }
  }

  private getDetailedResults(
    result: ISimpleHistoryResult
  ): IBasicResponse<IDetailedHistoryResultItem> | null {
    if (!result.detailedHistoryResult) {
      return null
    }
    this.initialDetails.set(this.defaultInitialDetails)
    return {
      content:
        result.detailedHistoryResult?.map((item) => {
          let retVal: IDetailedHistoryResultItem
          if (item.searchable) {
            const search = Array.isArray(item.searchTerm)
              ? item.searchTerm.map((term) => `${item.title}=${term}`).join("&")
              : `${item.title}=${item.searchTerm || item.value}`
            const values =
              item.title === "time" ? item.value.split(" ") : [item.value]
            retVal = {
              title: this.i18nStore.translate(item.title),
              value: `<a href="/${this.i18nStore.activeLang}/${
                ERoutes.OPEN_DATA
              }?${search}">${values[0]}</a>&nbsp;${values[1] ?? ""}`,
            }
          } else if (item.mappable) {
            const search = `lat=${item.mapProps?.coordinates![1]}&lon=${
              item.mapProps?.coordinates![0]
            }&accuracy=${item.mapProps?.accuracy}`
            this.mapParams.set(new URLSearchParams(search))
            retVal = {
              title: this.i18nStore.translate(item.title),
              value: `<a href="/${this.i18nStore.activeLang}/${ERoutes.MAP}?${search}">${item.value}</a>`,
            }
          } else {
            retVal = {
              title: this.i18nStore.translate(item.title),
              value: item.value,
            }
          }
          if (item.initial) {
            this.initialDetails().content.push(retVal)
          }
          return retVal
        }) ?? [],
      totalElements: result.detailedHistoryResult?.length ?? 0,
    }
  }
}
