import { Injectable } from "@angular/core"
import { catchError, concatMap, of, tap } from "rxjs"
import { HttpClient, HttpParams } from "@angular/common/http"
import saveAs from "file-saver"
import { I18nStore } from "../../i18n/store/i18n.store"
import { MessageService } from "../../shared/services/message.service"
import { MainStore } from "../../shared/store/main.store"
import { ERROR_OCCURED } from "../../test/constants/strings"

@Injectable({
  providedIn: "root",
})
export class HistoryExportService {
  protected get basePdfUrl() {
    return `${this.mainStore.api().url_web_statistic_server}/export/pdf/${
      this.i18nStore.activeLang
    }`
  }

  constructor(
    protected i18nStore: I18nStore,
    protected mainStore: MainStore,
    protected message: MessageService,
    protected http: HttpClient
  ) {}

  exportAs(format: "csv" | "xlsx", results: any[]) {
    const exportUrl = `${
      this.mainStore.api().url_web_statistic_server
    }/opentests/search`
    if (!exportUrl) {
      return of(null)
    }

    this.mainStore.inProgress$.next(true)
    return this.http
      .post(exportUrl, this.getExportParams(format, results), {
        responseType: "blob",
        observe: "response",
      })
      .pipe(tap(this.saveFile(format)), catchError(this.handleError))
  }

  exportAsPdf(results: any[]) {
    if (!this.basePdfUrl) {
      return of(null)
    }
    this.mainStore.inProgress$.next(true)
    return this.http
      .post(this.basePdfUrl, this.getExportParams("pdf", results))
      .pipe(
        concatMap((resp: any) => {
          if (resp?.["file"]) {
            return this.http.get(`${this.basePdfUrl}/${resp["file"]}`, {
              responseType: "blob",
              observe: "response",
            })
          }
          return of(null)
        }),
        tap(this.saveFile("pdf")),
        catchError(this.handleError)
      )
  }

  protected saveFile = (format: string) => (data: any) => {
    if (data?.body) saveAs(data.body, `${new Date().toISOString()}.${format}`)

    this.mainStore.inProgress$.next(false)
  }

  protected handleError = () => {
    this.mainStore.inProgress$.next(false)
    this.message.openSnackbar(ERROR_OCCURED)
    return of(null)
  }

  protected getExportParams(format: string, results: any[]) {
    const openTestUuid = results
      .map((hi) => hi.openTestResponse?.["open_test_uuid"])
      .filter((v) => !!v)
    if (openTestUuid.length !== 0) {
      return new HttpParams({
        fromObject: {
          open_test_uuid: openTestUuid.join(","),
          format,
          max_results: 1000,
        },
      })
    }
    const testUuid = results.map((hi) => "T" + hi.testUuid)
    return new HttpParams({
      fromObject: {
        test_uuid: testUuid.join(","),
        format,
        max_results: 1000,
      },
    })
  }
}
