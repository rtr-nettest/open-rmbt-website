import { Injectable, signal } from "@angular/core"
import { IOpendataFilters } from "../interfaces/opendata-filters.interface"
import { IRecentMeasurement } from "../interfaces/recent-measurements-response.interface"

export const OPEN_DATA_LIMIT = 100

export const DEFAULT_FILTERS: IOpendataFilters = {
  max_results: OPEN_DATA_LIMIT,
  additional_info: ["download_classification", "signal_classification"],
}

@Injectable({
  providedIn: "root",
})
export class OpendataStoreService {
  filters = signal<IOpendataFilters>(DEFAULT_FILTERS)
  cursor = signal<number>(0)
  data = signal<IRecentMeasurement[]>([])

  reset() {
    this.cursor.set(0)
    this.data.set([])
    this.filters.set(DEFAULT_FILTERS)
  }
}
