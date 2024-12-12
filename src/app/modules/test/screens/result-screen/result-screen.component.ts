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
  initialDetails: IBasicResponse<IDetailedHistoryResultItem> = {
    content: [],
    get totalElements() {
      return this.content.length
    },
  }

  get activeLang() {
    return this.i18nStore.activeLang
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
      switch (key) {
        case "downloadKbit":
          return [
            ...acc,
            {
              title: "Download",
              value:
                this.classification.getPhaseIconByClass(
                  "down",
                  result.downloadClass
                ) + this.getSpeedInMbps(value),
            },
          ]
        case "uploadKbit":
          return [
            ...acc,
            {
              title: "Upload",
              value:
                this.classification.getPhaseIconByClass(
                  "up",
                  result.uploadClass
                ) + this.getSpeedInMbps(value),
            },
          ]
        case "ping":
          return [
            ...acc,
            {
              title: "Ping",
              value:
                this.classification.getPhaseIconByClass(
                  "ping",
                  result.pingClass
                ) + this.getPingInMs(value),
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

  weHaveToGoBack() {
    if (this.mainStore.referrer$.value?.includes(ERoutes.HISTORY)) {
      this.router.navigate(["/", ERoutes.HISTORY])
    } else if (
      this.mainStore.referrer$.value?.includes(
        ERoutes.LOOP_RESULT.split("/")[0]
      )
    ) {
      const parts = this.mainStore.referrer$.value.split("/")
      this.router.navigateByUrl(
        ERoutes.LOOP_RESULT.replace(":loopUuid", parts[parts.length - 1])
      )
    } else {
      this.router.navigate(["/"])
    }
  }
}
