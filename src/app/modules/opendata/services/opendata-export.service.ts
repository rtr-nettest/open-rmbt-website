import { Injectable } from "@angular/core"
import { IRecentMeasurement } from "../interfaces/recent-measurements-response.interface"
import { MainStore } from "../../shared/store/main.store"
import { catchError, of, tap } from "rxjs"
import { HttpClient, HttpParams } from "@angular/common/http"
import { HistoryExportService } from "../../history/services/history-export.service"

@Injectable({
  providedIn: "root",
})
export class OpendataExportService extends HistoryExportService {
  override getExportParams(
    format: "csv" | "xlsx",
    results: IRecentMeasurement[]
  ) {
    const fromObject: Record<string, any> = {
      format,
      max_results: results.length,
    }
    const search = location.search.slice(1)
    const params = search.split("&")
    for (let i = 0, n = params.length; i < n; i++) {
      const parts = params[i].split("=")
      fromObject[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1])
    }
    return new HttpParams({
      fromObject,
    })
  }
}
