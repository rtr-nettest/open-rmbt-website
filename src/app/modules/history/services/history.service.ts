import { Injectable } from "@angular/core"
import {
  catchError,
  combineLatest,
  forkJoin,
  from,
  map,
  Observable,
  of,
  switchMap,
  take,
  tap,
} from "rxjs"
import { SimpleHistoryResult } from "../dto/simple-history-result.dto"
import { TestPhaseState } from "../../test/dto/test-phase-state.dto"
import { EMeasurementStatus } from "../../test/constants/measurement-status.enum"
import { TestVisualizationState } from "../../test/dto/test-visualization-state.dto"
import { IPaginator } from "../../tables/interfaces/paginator.interface"
import { ITestResultRequest } from "../interfaces/measurement-result.interface"
import { HistoryRepositoryService } from "../repository/history-repository.service"
import { TestStore } from "../../test/store/test.store"
import { HistoryStore } from "../store/history.store"
import { I18nStore } from "../../i18n/store/i18n.store"
import { MainStore } from "../../shared/store/main.store"
import { ISimpleHistoryResult } from "../interfaces/simple-history-result.interface"
import { IHistoryGroupItem } from "../interfaces/history-row.interface"
import { ISort } from "../../tables/interfaces/sort.interface"
import { environment } from "../../../../environments/environment"

@Injectable({
  providedIn: "root",
})
export class HistoryService {
  constructor(
    private historyStore: HistoryStore,
    private repo: HistoryRepositoryService,
    private testStore: TestStore,
    private i18nStore: I18nStore,
    private mainStore: MainStore
  ) {}

  getOpenResult(params: ITestResultRequest) {
    return this.getMeasurementResult(
      params,
      forkJoin([of(null), this.repo.getOpenResult(params)])
    )
  }

  getPrivateResult(params: ITestResultRequest) {
    return this.getMeasurementResult(
      params,
      from(this.repo.getResult(params)).pipe(
        switchMap((response) => {
          params.openTestUuid = response.open_test_uuid
          return forkJoin([of(response), this.repo.getOpenResult(params)])
        })
      )
    )
  }

  private getMeasurementResult(
    params: ITestResultRequest,
    observable: Observable<[any, any]>
  ) {
    if (!params || this.mainStore.error$.value) {
      return of(null)
    }
    return observable.pipe(
      map(([response, openTestsResponse]) => {
        const historyResult = SimpleHistoryResult.fromOpenTestResponse(
          params.testUuid!,
          response,
          openTestsResponse
        )
        if (historyResult.openTestResponse && response) {
          const trdSet = new Set(
            Object.entries(historyResult.openTestResponse).map(([key, value]) =>
              this.i18nStore.translate(key)
            )
          )
          const details = Object.entries(response).map(([key, value]) => [
            this.i18nStore.translate(key),
            value,
          ]) as [string, any][]
          for (const [key, value] of details) {
            if (
              !trdSet.has(key) &&
              (typeof value === "string" || typeof value === "number")
            ) {
              historyResult.openTestResponse[key] = value
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
        this.testStore.basicNetworkInfo.set({
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
        console.warn(e)
        return of(null)
      })
    )
  }

  getHistoryGroupedByLoop(options?: {
    grouped?: boolean
    loopUuid?: string | null
  }) {
    return combineLatest([
      this.historyStore.history$,
      this.i18nStore.getTranslations(),
      this.historyStore.openLoops$,
    ]).pipe(
      map(([history, t, openLoops]) => {
        if (!history.length) {
          return null
        }
        const loopHistory = this.getLoopResults(history, options?.loopUuid)
        const content = options?.grouped
          ? this.groupResults(loopHistory, openLoops)
          : loopHistory
        const totalElements = history[0].paginator?.totalElements
        return {
          content,
          totalElements: totalElements ?? content.length,
        }
      })
    )
  }

  getLoopHistory(loopUuid: string) {
    return from(
      this.repo.getHistory({
        paginator: {
          offset: 0,
          limit: environment.loopModeDefaults.max_tests,
        },
        loopUuid,
      })
    ).pipe(
      take(1),
      map((history) => {
        const content = history.filter(
          (hi: SimpleHistoryResult) => hi.loopUuid === loopUuid
        )
        return {
          content,
          totalElements: content.length,
        }
      })
    )
  }

  getFullMeasurementHistory(paginator: IPaginator, loopUuid?: string) {
    if (!paginator.limit) {
      return of([])
    }
    return from(this.repo.getHistory({ paginator, loopUuid })).pipe(
      take(1),
      map((history) => {
        const mergedHistory = [...this.historyStore.history$.value, ...history]
        this.historyStore.history$.next(mergedHistory)
        return mergedHistory
      })
    )
  }

  resetMeasurementHistory() {
    this.historyStore.history$.next([])
    this.historyStore.paginator.set({
      offset: 0,
      limit: environment.loopModeDefaults.max_tests,
    })
  }

  sortMeasurementHistory(sort: ISort, callback: () => any) {
    this.resetMeasurementHistory()
    this.historyStore.sort.set(sort)
    callback()
  }

  private getLoopResults(
    history: ISimpleHistoryResult[],
    loopUuid?: string | null
  ) {
    if (!loopUuid) {
      return history
    }
    return history.filter((hi) => hi.loopUuid === loopUuid)
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
            id: history[i].loopUuid!,
            groupHeader: history[i].measurementDate,
          })
        }
        retVal.push({
          ...history[i],
          id: history[i].testUuid!,
          hidden: !openLoops.includes(history[i].loopUuid!),
        })
      } else {
        retVal.push({
          ...history[i],
          id: history[i].testUuid!,
        })
      }
    }
    return retVal
  }

  syncHistory(syncCode: string | null = null) {
    return this.repo.syncHistory(syncCode).pipe(
      map((data) => {
        if (data.error.length > 0) {
          throw new Error(data.error[0])
        } else if (data.sync[0].msg_text && data.sync[0].msg_text.length > 0) {
          return data.sync[0].msg_text
        } else {
          return data.sync[0].sync_code
        }
      })
    )
  }
}
