import { HttpClient } from "@angular/common/http"
import { Injectable } from "@angular/core"
import { environment } from "../../../../environments/environment"
import { IStatisticsRequest } from "../interfaces/statistics-request.interface"
import { map, Observable, of } from "rxjs"
import { IBrowserData } from "../interfaces/browser-data.interface"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import dayjs from "dayjs"
import {
  IStatisticsProvider,
  IStatisticsResponse,
} from "../interfaces/statistics-response.interface.interface"
import { IBasicResponse } from "../../tables/interfaces/basic-response.interface"
dayjs.extend(utc)
dayjs.extend(timezone)

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
      return of({} as IStatisticsResponse)
    }
    return this.http.post<IStatisticsResponse>(
      `${environment.api.cloud}/RMBTStatisticServer/statistics`,
      {
        body: {
          ...body,
          ...(body.end_date
            ? {
                end_date: dayjs(body.end_date)
                  .endOf("day")
                  .utc()
                  .format("YYYY-MM-DD HH:mm:ss"),
              }
            : {}),
        },
      }
    )
  }
}
