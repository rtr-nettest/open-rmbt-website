import { Injectable } from "@angular/core"
import { BehaviorSubject } from "rxjs"
import { IStatisticsRequest } from "../interfaces/statistics-request.interface"
import { IBrowserData } from "../interfaces/browser-data.interface"

@Injectable({
  providedIn: "root",
})
export class StatisticsStoreService {
  browserData$ = new BehaviorSubject<IBrowserData | null>(null)
  filters$ = new BehaviorSubject<IStatisticsRequest | null>(null)
}
