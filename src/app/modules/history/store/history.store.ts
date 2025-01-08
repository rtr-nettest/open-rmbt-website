import { Injectable } from "@angular/core"
import { BehaviorSubject } from "rxjs"
import { ISimpleHistoryResult } from "../interfaces/simple-history-result.interface"
import { IPaginator } from "../../tables/interfaces/paginator.interface"
import { ISort } from "../../tables/interfaces/sort.interface"

@Injectable({
  providedIn: "root",
})
export class HistoryStore {
  simpleHistoryResult$ = new BehaviorSubject<ISimpleHistoryResult | null>(null)
  history$ = new BehaviorSubject<Array<ISimpleHistoryResult>>([])
  historyPaginator$ = new BehaviorSubject<IPaginator>({
    offset: 0,
  })
  historySort$ = new BehaviorSubject<ISort>({
    active: "measurementDate",
    direction: "desc",
  })
  openLoops$ = new BehaviorSubject<string[]>([])
}
