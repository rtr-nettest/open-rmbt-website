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
import { TestChartComponent } from "../../../charts/components/test-chart/test-chart.component"
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
import {
  PhaseDurations,
  SignalChartComponent,
} from "../../../charts/components/signal-chart/signal-chart.component"
import formatcoords from "formatcoords"
import { LOC_FORMAT } from "../../../shared/pipes/lonlat.pipe"
import { SKIPPED_FIELDS } from "../../constants/skipped-details-fields"
import { FORMATTED_FIELDS } from "../../constants/formatted-details-fields"
import { INITIAL_FIELDS } from "../../constants/initial-details-fields"
import { SEARCHED_FIELDS } from "../../constants/searched-details-fields"
import { SignalDetailsComponent } from "../../components/signal-details/signal-details.component"

const MIN_ACCURACY_FOR_SHOWING_MAP = 2000

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
    SignalDetailsComponent,
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
  phaseDurations = signal<PhaseDurations>({})

  get activeLang() {
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
    if (
      result.openTestResponse?.["speed_curve"]?.location &&
      result.openTestResponse?.["loc_accuracy"] !== null &&
      result.openTestResponse?.["loc_accuracy"] <= MIN_ACCURACY_FOR_SHOWING_MAP
    ) {
      this.locationTable.set(result.openTestResponse?.["speed_curve"]?.location)
    }
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
    if (!result.openTestResponse) {
      return null
    }
    const { openTestResponse } = result
    let entries = new Array(Object.entries(openTestResponse).length)
    const entriesMap = new Map(Object.entries(openTestResponse))
    const initialKeys = [...INITIAL_FIELDS]
    for (let i = 0; i < initialKeys.length; i++) {
      entries[i] = [initialKeys[i], openTestResponse[initialKeys[i]]]
      entriesMap.delete(initialKeys[i])
    }
    entries = [...entries, ...entriesMap].filter((v) => !!v)

    let content: IDetailedHistoryResultItem[] = []
    const location = this.formatLocation("location", openTestResponse)
    if (location) {
      content.push(location)
    }
    this.initialDetails().content = [...content]

    for (const [key, value] of entries) {
      this.setPhaseDurations({ title: key, value })
      if (SKIPPED_FIELDS.has(key) || !value) {
        continue
      }
      if (key == "land_cover") {
        content = [...content, ...this.formatLandCovers(openTestResponse)]
      }
      const item = this.formatSearchableItem(openTestResponse, key, value)
      content.push(item)
      if (INITIAL_FIELDS.has(key)) {
        this.initialDetails().content.push(item)
      }
    }

    return {
      content,
      totalElements: content.length ?? 0,
    }
  }

  private formatSearchableItem(openTestResponse: any, key: string, value: any) {
    const searchable = SEARCHED_FIELDS[key] !== undefined
    let v = FORMATTED_FIELDS[key]
      ? FORMATTED_FIELDS[key](openTestResponse, this.i18nStore.translations)
      : value
    if (!searchable) {
      return {
        title: this.i18nStore.translate(key),
        value: v,
      }
    }
    const searchTerm = SEARCHED_FIELDS[key]
      ? SEARCHED_FIELDS[key](openTestResponse)
      : undefined
    const search = Array.isArray(searchTerm)
      ? searchTerm.map((term) => `${key}=${term}`).join("&")
      : `${key}=${searchTerm || value}`
    const values = key === "time" ? v.split(" ") : [v]
    return {
      title: this.i18nStore.translate(key),
      value: `<a href="/${this.i18nStore.activeLang}/${
        ERoutes.OPEN_DATA
      }?${search}">${values[0]}</a>&nbsp;${values[1] ?? ""}`,
    }
  }

  private formatLocation(title: string, openTestResponse: any) {
    if (!openTestResponse?.["lat"] || !openTestResponse?.["long"]) {
      return null
    }
    const value = `${formatcoords(
      openTestResponse["lat"],
      openTestResponse["long"]
    ).format(LOC_FORMAT)} (${
      openTestResponse["loc_src"] ? `${openTestResponse["loc_src"]}, ` : ""
    } +/- ${Math.round(openTestResponse["loc_accuracy"])}m)`
    const search = [
      `lat=${openTestResponse["lat"]}`,
      `lon=${openTestResponse["long"]}`,
      `accuracy=${openTestResponse["loc_accuracy"]}`,
    ]
    if (openTestResponse["distance"]) {
      search.push(`distance=${openTestResponse["distance"]}`)
    }
    const searchString = search.join("&")
    this.mapParams.set(new URLSearchParams(searchString))
    return {
      title: this.i18nStore.translate(title),
      value: `<a href="/${this.i18nStore.activeLang}/${ERoutes.MAP}?${searchString}">${value}</a>`,
    }
  }

  private formatLandCovers(openTestResponse: any) {
    return [
      {
        title: this.i18nStore.translate("land_cover_cat1"),
        value: FORMATTED_FIELDS["land_cover_cat1"]!(
          openTestResponse,
          this.i18nStore.translations
        ),
      },
      {
        title: this.i18nStore.translate("land_cover_cat2"),
        value: FORMATTED_FIELDS["land_cover_cat2"]!(
          openTestResponse,
          this.i18nStore.translations
        ),
      },
    ]
  }

  private setPhaseDurations(item: IDetailedHistoryResultItem) {
    if (item.title == "time_dl_ms") {
      this.phaseDurations().downStart = parseFloat(item.value)
    }
    if (item.title == "duration_download_ms") {
      this.phaseDurations().downDuration = parseFloat(item.value)
    }
    if (item.title == "time_ul_ms") {
      this.phaseDurations().upStart = parseFloat(item.value)
    }
    if (item.title == "duration_upload_ms") {
      this.phaseDurations().upDuration = parseFloat(item.value)
    }
    if (item.title == "speed_curve") {
      const pings = item.value["ping"]
      this.phaseDurations().pingStart = pings[0].time_elapsed
      this.phaseDurations().pingDuration =
        pings[pings.length - 1].time_elapsed - pings[0].time_elapsed
    }
  }
}
