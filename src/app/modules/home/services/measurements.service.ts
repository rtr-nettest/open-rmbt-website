import { HttpClient } from "@angular/common/http"
import { Injectable } from "@angular/core"
import {
  IRecentMeasurementsResponse,
  IRecentStats,
} from "../interfaces/recent-measurements-response.interface"
import { environment } from "../../../../environments/environment"

@Injectable({
  providedIn: "root",
})
export class MeasurementsService {
  constructor(private readonly http: HttpClient) {}

  getRecentMeasurements() {
    return this.http.get<IRecentMeasurementsResponse>(
      `${environment.api.cloud}/cache/recent?_=${Date.now()}`
    )
  }

  getRecentStats() {
    return this.http.get<IRecentStats>(
      `${environment.api.cloud}/RMBTStatisticServer/opentests/statistics`
    )
  }
}
