import { Injectable, signal } from "@angular/core"
import { BehaviorSubject } from "rxjs"
import { IStatisticsRequest } from "../interfaces/statistics-request.interface"
import { IBrowserData } from "../interfaces/browser-data.interface"
import { adjustTimePeriod } from "../../shared/util/time"
import dayjs from "dayjs"

export const DEFAULT_FILTERS: IStatisticsRequest = {
  timezone: dayjs.tz.guess(),
  type: "mobile",
  province: -1,
  end_date: null,
  quantile: "0.5",
  network_type_group: "all",
  max_devices: 100,
  capabilities: { classification: { count: 4 } },
  language: null,
  duration: null,
  location_accuracy: null,
  country: null,
}

@Injectable({
  providedIn: "root",
})
export class StatisticsStoreService {
  browserData$ = new BehaviorSubject<IBrowserData | null>(null)
  filters$ = new BehaviorSubject<IStatisticsRequest | null>(null)
  durations = signal<[number, string][]>([
    [1, "24 hours"],
    [7, "1 week"],
    [30, "1 month"],
    [90, "3 months"],
    [180, "6 months"],
    [365, "1 year"],
    [730, "2 years"],
    [1095, "3 years"],
    [1460, "4 years"],
    [2920, "8 years"],
  ])

  get filters() {
    return this.filters$.value
  }

  adjustTimePeriods(endDateString?: string | null) {
    let enddate = endDateString ? dayjs(endDateString).utc() : dayjs().utc()
    const durations = this.durations()
    for (const option of durations) {
      adjustTimePeriod(option, enddate)
    }
    this.durations.set(durations)
  }
}
