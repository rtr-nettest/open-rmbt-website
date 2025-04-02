import { Injectable, signal } from "@angular/core"
import { BehaviorSubject } from "rxjs"
import { ISimpleHistoryResult } from "../interfaces/simple-history-result.interface"
import { IPaginator } from "../../tables/interfaces/paginator.interface"
import { ISort } from "../../tables/interfaces/sort.interface"

export const HISTORY_LIMIT = 100

@Injectable({
  providedIn: "root",
})
export class HistoryStore {
  simpleHistoryResult$ = new BehaviorSubject<ISimpleHistoryResult | null>(null)
  history$ = new BehaviorSubject<Array<ISimpleHistoryResult>>([])
  paginator = signal<IPaginator>({
    offset: 0,
    limit: HISTORY_LIMIT,
  })
  sort = signal<ISort>({
    active: "measurementDate",
    direction: "desc",
  })
  openLoops$ = new BehaviorSubject<string[]>([])
}
