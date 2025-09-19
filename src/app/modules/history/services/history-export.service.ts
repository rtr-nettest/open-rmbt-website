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
  protected get quickPdfUrl() {
    return `${this.mainStore.api().url_statistic_server}/export/pdf/${
      this.i18nStore.activeLang
    }`
  }

  protected get slowPdfUrl() {
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

  quickPdfExport(results: any[]) {
    const formdata = new FormData()
    formdata.append(
      "open_test_uuid",
      results[0].openTestResponse?.["open_test_uuid"]
    )
    return this.exportAsPdf(results, this.quickPdfUrl, formdata)
  }

  slowPdfExport(results: any[]) {
    return this.exportAsPdf(results, this.slowPdfUrl)
  }

  private exportAsPdf(
    results: any[],
    basePdfUrl: string,
    httpParams?: HttpParams | FormData
  ) {
    if (!basePdfUrl) {
      return of(null)
    }
    this.mainStore.inProgress$.next(true)
    return this.http
      .post(basePdfUrl, httpParams || this.getExportParams("pdf", results), {
        headers: { Accept: "application/pdf" },
        responseType: "blob",
        observe: "response",
      })
      .pipe(tap(this.saveFile("pdf")), catchError(this.handleError))
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
