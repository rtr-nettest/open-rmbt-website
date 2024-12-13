import { Injectable } from "@angular/core"
import {
  BehaviorSubject,
  combineLatest,
  from,
  map,
  of,
  switchMap,
  take,
  tap,
} from "rxjs"
import { DatePipe } from "@angular/common"
import { I18nStore, Translation } from "../../i18n/store/i18n.store"
import { ISimpleHistoryResult } from "../interfaces/simple-history-result.interface"
import { IPaginator } from "../../tables/interfaces/paginator.interface"
import { ISort } from "../../tables/interfaces/sort.interface"
import { ClassificationService } from "../../shared/services/classification.service"
import {
  IHistoryGroupItem,
  IHistoryRowRTR,
} from "../interfaces/history-row.interface"
import { ExpandArrowComponent } from "../../shared/components/expand-arrow/expand-arrow.component"
import { TestService } from "../services/test.service"
import { roundToSignificantDigits } from "../../shared/util/math"

@Injectable({
  providedIn: "root",
})
export class HistoryStore {
  history$ = new BehaviorSubject<Array<ISimpleHistoryResult>>([])
  historyPaginator$ = new BehaviorSubject<IPaginator>({
    offset: 0,
  })
  historySort$ = new BehaviorSubject<ISort>({
    active: "measurementDate",
    direction: "desc",
  })
  openLoops$ = new BehaviorSubject<string[]>([])

  constructor(
    private classification: ClassificationService,
    private datePipe: DatePipe,
    private i18nStore: I18nStore,
    private service: TestService
  ) {}

  getFormattedHistory(options?: {
    grouped?: boolean
    loopUuid?: string | null
  }) {
    return combineLatest([
      this.history$,
      this.i18nStore.getTranslations(),
      this.historyPaginator$,
      this.openLoops$,
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

  getMeasurementHistory() {
    return this.historyPaginator$.pipe(
      take(1),
      switchMap((paginator) => {
        return this.service.getMeasurementHistory({
          offset: paginator.offset,
        })
      }),
      tap((history) => {
        if (history) {
          this.history$.next(history)
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

  getRecentMeasurementHistory(paginator: IPaginator, sort?: ISort) {
    if (!paginator.limit) {
      return of([])
    }
    return from(this.service.getMeasurementHistory(paginator)).pipe(
      take(1),
      tap((history) => {
        this.history$.next(history)
      })
    )
  }

  resetMeasurementHistory() {
    this.history$.next([])
    this.historyPaginator$.next({ offset: 0 })
  }

  sortMeasurementHistory(sort: ISort, callback: () => any) {
    this.resetMeasurementHistory()
    this.historySort$.next(sort)
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
