import { HttpClient } from "@angular/common/http"
import { Injectable } from "@angular/core"
import { IRecentMeasurementsResponse } from "../interfaces/recent-measurements-response.interface"
import { environment } from "../../../../environments/environment"

@Injectable({
  providedIn: "root",
})
export class MeasurementsService {
  constructor(private readonly http: HttpClient) {}

  getRecentMeasurements() {
    return this.http.get<IRecentMeasurementsResponse>(
      `${environment.api.map}/cache/recent?_=${Date.now()}`
    )
  }
}
