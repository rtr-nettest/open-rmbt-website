import { Injectable, signal } from "@angular/core"
import { BehaviorSubject } from "rxjs"
import { ISimpleHistoryResult } from "../interfaces/simple-history-result.interface"
import { IPaginator } from "../../tables/interfaces/paginator.interface"
import { ISort } from "../../tables/interfaces/sort.interface"
import { environment } from "../../../../environments/environment"

@Injectable({
  providedIn: "root",
})
export class HistoryStore {
  simpleHistoryResult$ = new BehaviorSubject<ISimpleHistoryResult | null>(null)
  history$ = new BehaviorSubject<Array<ISimpleHistoryResult>>([])
  paginator = signal<IPaginator>({
    offset: 0,
    limit: environment.loopModeDefaults.max_tests,
  })
  sort = signal<ISort>({
    active: "measurementDate",
    direction: "desc",
  })
  openLoops$ = new BehaviorSubject<string[]>([])
}
