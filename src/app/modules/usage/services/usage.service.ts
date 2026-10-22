import { HttpClient, HttpParams } from "@angular/common/http"
import { inject, Injectable } from "@angular/core"
import { MainStore } from "../../shared/store/main.store"
import { IUsageReport, TUsageStatistic } from "../interfaces/usage.interface"

const ALL_STATISTICS: TUsageStatistic[] = [
  "usage",
  "platforms",
  "platforms_loopmode",
  "platforms_qos",
  "network_group_names",
  "network_group_types",
  "versions_ios",
  "versions_android",
]

@Injectable({
  providedIn: "root",
})
export class UsageService {
  private readonly http = inject(HttpClient)
  private readonly mainStore = inject(MainStore)

  /**
   * @param year full year, e.g. 2025
   * @param month zero-based month (0 = January), matching the admin/usageJSON API
   */
  getUsage(year: number, month: number) {
    let params = new HttpParams()
      .set("year", year)
      .set("month", month)
    // passing any statistic[] clears the server-side default set (which omits
    // QoS), so we request every section explicitly to get the full report
    for (const statistic of ALL_STATISTICS) {
      params = params.append("statistic[]", statistic)
    }
    return this.http.get<IUsageReport>(
      `${this.mainStore.api().url_web_statistic_server}/admin/usageJSON`,
      { params }
    )
  }
}
