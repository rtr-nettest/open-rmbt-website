import { HttpClient } from "@angular/common/http"
import { Injectable } from "@angular/core"
import {
  IRecentMeasurementsResponse,
  IRecentStats,
} from "../interfaces/recent-measurements-response.interface"
import { MainStore } from "../../shared/store/main.store"

@Injectable({
  providedIn: "root",
})
export class MeasurementsService {
  constructor(
    private readonly http: HttpClient,
    private readonly mainStore: MainStore
  ) {}

  getRecentMeasurements() {
    return this.http.get<IRecentMeasurementsResponse>(
      `${this.mainStore.cloud()}/cache/recent?_=${Date.now()}`
    )
  }

  getRecentStats() {
    return this.http.get<IRecentStats>(
      `${this.mainStore.cloud()}/RMBTStatisticServer/opentests/statistics`
    )
  }
}
