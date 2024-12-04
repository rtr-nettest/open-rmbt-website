import { HttpClient } from "@angular/common/http"
import { Injectable } from "@angular/core"
import { environment } from "../../../../environments/environment"
import { IStatisticsRequest } from "../interfaces/statistics-request.interface"
import { of } from "rxjs"
import { IBrowserData } from "../interfaces/browser-data.interface"

@Injectable({
  providedIn: "root",
})
export class StatisticsService {
  constructor(private readonly http: HttpClient) {}

  getBrowserData() {
    return this.http.get<IBrowserData>(
      `${environment.api.baseUrl}/RMBTControlServer/requestDataCollector`
    )
  }

  getStatistics(body: IStatisticsRequest | null) {
    if (!body) {
      return of(null)
    }
    return this.http.post(
      `${environment.api.cloud}/RMBTStatisticServer/statistics`,
      body
    )
  }
}
