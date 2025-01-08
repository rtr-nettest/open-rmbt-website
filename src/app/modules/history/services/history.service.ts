import { Injectable } from "@angular/core"
import {
  catchError,
  combineLatest,
  forkJoin,
  from,
  map,
  of,
  take,
  tap,
} from "rxjs"
import { SimpleHistoryResult } from "../dto/simple-history-result.dto"
import { TestPhaseState } from "../../test/dto/test-phase-state.dto"
import { EMeasurementStatus } from "../../test/constants/measurement-status.enum"
import { TestVisualizationState } from "../../test/dto/test-visualization-state.dto"
import { ERoutes } from "../../shared/constants/routes.enum"
import { IPaginator } from "../../tables/interfaces/paginator.interface"
import { ITestResultRequest } from "../interfaces/measurement-result.interface"
import { HistoryRepositoryService } from "../repository/history-repository.service"
import { TestStore } from "../../test/store/test.store"
import { HistoryStore } from "../store/history.store"
import { I18nStore, Translation } from "../../i18n/store/i18n.store"
import { Router } from "@angular/router"
import { MainStore } from "../../shared/store/main.store"
import { ISimpleHistoryResult } from "../interfaces/simple-history-result.interface"
import {
  IHistoryGroupItem,
  IHistoryRowRTR,
} from "../interfaces/history-row.interface"
import { ISort } from "../../tables/interfaces/sort.interface"
import { ExpandArrowComponent } from "../../shared/components/expand-arrow/expand-arrow.component"
import { roundToSignificantDigits } from "../../shared/util/math"
import { ClassificationService } from "../../shared/services/classification.service"
import { DatePipe } from "@angular/common"

@Injectable({
  providedIn: "root",
})
export class HistoryService {
  constructor(
    private classification: ClassificationService,
    private datePipe: DatePipe,
    private historyStore: HistoryStore,
    private repo: HistoryRepositoryService,
    private testStore: TestStore,
    private i18nStore: I18nStore,
    private router: Router,
    private mainStore: MainStore
  ) {}

  getMeasurementResult(params: ITestResultRequest) {
    if (!params || this.mainStore.error$.value) {
      return of(null)
    }
    return forkJoin([
      from(this.repo.getOpenResult(params)),
      from(this.repo.getResult(params)),
    ]).pipe(
      map(([openTestsResponse, [response, testResultDetail]]) => {
        const historyResult = SimpleHistoryResult.fromOpenTestResponse(
          params.testUuid!,
          response,
          openTestsResponse
        )
        if (
          historyResult.openTestResponse &&
          testResultDetail?.testresultdetail.length
        ) {
          const trdSet = new Set(
            Object.entries(historyResult.openTestResponse).map(([key, value]) =>
              this.i18nStore.translate(key)
            )
          )
          for (const item of testResultDetail.testresultdetail) {
            if (!trdSet.has(item.title)) {
              historyResult.openTestResponse[item.title] = item.value
            }
          }
        }
        this.historyStore.simpleHistoryResult$.next(historyResult)
        const newPhase = new TestPhaseState({
          phase: EMeasurementStatus.SHOWING_RESULTS,
          down: historyResult.download.value / 1000,
          up: historyResult.upload.value / 1000,
          ping: historyResult.ping.value / 1e6,
        })
        const newState = TestVisualizationState.fromHistoryResult(
          historyResult,
          this.testStore.visualization$.value,
          newPhase
        )
        this.testStore.visualization$.next(newState)
        this.testStore.basicNetworkInfo$.next({
          serverName: historyResult.measurementServerName,
          ipAddress: historyResult.ipAddress,
          providerName: historyResult.providerName,
          coordinates: historyResult.openTestResponse
            ? [
                historyResult.openTestResponse["long"],
                historyResult.openTestResponse["lat"],
              ]
            : undefined,
        })
        return historyResult
      }),
      catchError((e) => {
        console.log(e)
        this.router.navigate([
          this.i18nStore.activeLang,
          ERoutes.PAGE_NOT_FOUND,
        ])
        return of(null)
      })
    )
  }

  async getMeasurementHistory(paginator?: IPaginator) {
    return this.repo.getHistory(paginator)
  }

  getFormattedHistory(options?: {
    grouped?: boolean
    loopUuid?: string | null
  }) {
    return combineLatest([
      this.historyStore.history$,
      this.i18nStore.getTranslations(),
      this.historyStore.historyPaginator$,
      this.historyStore.openLoops$,
    ]).pipe(
      map(([history, t, paginator, openLoops]) => {
        if (!history.length) {
          return { content: [], totalElements: 0 }
        }
        const loopHistory = this.getLoopResults(history, options?.loopUuid)
        const countedHistory = this.countResults(loopHistory, paginator)
        const h = options?.grouped
          ? this.groupResults(countedHistory, openLoops)
          : countedHistory
        const content = h.map(this.historyItemToRowRTR(t, openLoops))
        const totalElements = history[0].paginator?.totalElements
        return {
          content,
          totalElements: totalElements ?? content.length,
        }
      })
    )
  }

  private groupResults(history: ISimpleHistoryResult[], openLoops: string[]) {
    const retVal: Array<ISimpleHistoryResult & IHistoryGroupItem> = []
    const grouped: Set<string> = new Set()
    for (let i = 0; i < history.length; i++) {
      if (history[i].loopUuid) {
        if (!grouped.has(history[i].loopUuid!)) {
          grouped.add(history[i].loopUuid!)
          retVal.push({
            ...history[i],
            groupHeader: true,
          })
        }
        retVal.push({
          ...history[i],
          hidden: !openLoops.includes(history[i].loopUuid!),
        })
      } else {
        retVal.push(history[i])
      }
    }
    return retVal
  }

  getRecentMeasurementHistory(paginator: IPaginator) {
    if (!paginator.limit) {
      return of([])
    }
    return from(this.getMeasurementHistory(paginator)).pipe(
      take(1),
      tap((history) => {
        this.historyStore.history$.next(history)
      })
    )
  }

  resetMeasurementHistory() {
    this.historyStore.history$.next([])
    this.historyStore.historyPaginator$.next({ offset: 0 })
  }

  sortMeasurementHistory(sort: ISort, callback: () => any) {
    this.resetMeasurementHistory()
    this.historyStore.historySort$.next(sort)
    callback()
  }

  getLoopResults(history: ISimpleHistoryResult[], loopUuid?: string | null) {
    if (!loopUuid) {
      return history
    }
    return history.filter((hi) => hi.loopUuid === "L" + loopUuid)
  }

  private countResults(history: ISimpleHistoryResult[], paginator: IPaginator) {
    return history.map((hi, index) => ({
      ...hi,
      count: paginator.limit ? index + 1 : history.length - index,
    }))
  }

  private historyItemToRowRTR =
    (t: Translation, openLoops: string[]) =>
    (hi: ISimpleHistoryResult & IHistoryGroupItem): IHistoryRowRTR => {
      const locale = this.i18nStore.activeLang
      const measurementDate = this.datePipe.transform(
        hi.measurementDate,
        "medium",
        undefined,
        locale
      )!
      if (hi.groupHeader) {
        return {
          id: hi.loopUuid!,
          measurementDate,
          groupHeader: hi.groupHeader,
          details: ExpandArrowComponent,
          componentField: "details",
          parameters: {
            expanded: openLoops.includes(hi.loopUuid!),
          },
        }
      }
      return {
        id: hi.testUuid!,
        count: hi.count,
        measurementDate,
        download:
          this.classification.getPhaseIconByClass(
            "down",
            hi.download?.classification
          ) +
          roundToSignificantDigits(
            hi.download?.value || 0 / 1e3
          ).toLocaleString(locale) +
          " " +
          t["Mbps"],
        upload:
          this.classification.getPhaseIconByClass(
            "up",
            hi.upload?.classification
          ) +
          roundToSignificantDigits(hi.upload?.value || 0 / 1e3).toLocaleString(
            locale
          ) +
          " " +
          t["Mbps"],
        ping:
          this.classification.getPhaseIconByClass(
            "ping",
            hi.ping?.classification
          ) +
          hi.ping?.value.toLocaleString(locale) +
          " " +
          t["millis"],
        loopUuid: hi.loopUuid,
        hidden: hi.hidden,
      }
    }
}
