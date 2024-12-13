import { Component } from "@angular/core"
import { HeaderComponent } from "../../../shared/components/header/header.component"
import { TopNavComponent } from "../../../shared/components/top-nav/top-nav.component"
import { FooterComponent } from "../../../shared/components/footer/footer.component"
import { ScrollTopComponent } from "../../../shared/components/scroll-top/scroll-top.component"
import { TableComponent } from "../../../tables/components/table/table.component"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { AsyncPipe, DatePipe, NgIf } from "@angular/common"
import { ITableColumn } from "../../../tables/interfaces/table-column.interface"
import { Observable, of, switchMap, tap } from "rxjs"
import { ERoutes } from "../../../shared/constants/routes.enum"
import { UNKNOWN } from "../../constants/strings"
import { ISimpleHistoryResult } from "../../interfaces/simple-history-result.interface"
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
import { roundMs, roundToSignificantDigits } from "../../../shared/util/math"

@Component({
  selector: "app-result-screen",
  standalone: true,
  imports: [
    AsyncPipe,
    DatePipe,
    HeaderComponent,
    MatButtonModule,
    NgIf,
    RouterModule,
    TableComponent,
    TestChartComponent,
    TopNavComponent,
    TranslatePipe,
    FooterComponent,
    ScrollTopComponent,
    BreadcrumbsComponent,
  ],
  templateUrl: "./result-screen.component.html",
  styleUrl: "./result-screen.component.scss",
})
export class ResultScreenComponent {
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
  openResultBaseURL = ""
  openResultURL = ""
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
  routes = ERoutes
  showFullDetails = false
  initialDetails: IBasicResponse<IDetailedHistoryResultItem> =
    this.defaultInitialDetails

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
    private classification: ClassificationService,
    private exporter: HistoryExportService,
    private i18nStore: I18nStore,
    private mainStore: MainStore,
    private service: TestService,
    private store: TestStore,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.result$ = this.i18nStore.getTranslations().pipe(
      switchMap(() =>
        this.service.getMeasurementResult({
          openTestUuid: this.route.snapshot.queryParamMap.get("open_test_uuid"),
          testUuid:
            this.route.snapshot.queryParamMap
              .get("test_uuid")
              ?.replace("T", "") ?? null,
        })
      )
    )
    this.error$ = this.mainStore.error$
  }

  ngOnDestroy(): void {
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

  getBasicResults(
    result: ISimpleHistoryResult
  ): IBasicResponse<IDetailedHistoryResultItem> {
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
          if (!result.signal) {
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

  getDetailedResults(
    result: ISimpleHistoryResult
  ): IBasicResponse<IDetailedHistoryResultItem> | null {
    if (!result.detailedHistoryResult) {
      return null
    }
    this.initialDetails = this.defaultInitialDetails
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
            retVal = {
              title: this.i18nStore.translate(item.title),
              value: `<a href="/${this.i18nStore.activeLang}/${
                ERoutes.MAP
              }?lat=${item.coordinates![1]}&lon=${item.coordinates![0]}">${
                item.value
              }</a>`,
            }
          } else {
            retVal = {
              title: this.i18nStore.translate(item.title),
              value: item.value,
            }
          }
          if (item.initial) {
            this.initialDetails.content.push(retVal)
          }
          return retVal
        }) ?? [],
      totalElements: result.detailedHistoryResult?.length ?? 0,
    }
  }
}
