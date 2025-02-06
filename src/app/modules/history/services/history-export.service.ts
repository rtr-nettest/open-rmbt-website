import { Injectable } from "@angular/core"
import { catchError, concatMap, map, of, tap, finalize } from "rxjs"
import { HttpClient, HttpParams } from "@angular/common/http"
import saveAs from "file-saver"
import { I18nStore } from "../../i18n/store/i18n.store"
import { ISimpleHistoryResult } from "../../history/interfaces/simple-history-result.interface"
import { MessageService } from "../../shared/services/message.service"
import { MainStore } from "../../shared/store/main.store"
import { ECertifiedLocationType } from "../../certified/interfaces/certified-env-form.interface"
import { ERROR_OCCURED } from "../../test/constants/strings"
import { CertifiedStoreService } from "../../certified/store/certified-store.service"

@Injectable({
  providedIn: "root",
})
export class HistoryExportService {
  private get basePdfUrl() {
    return `${this.mainStore.api().url_web_statistic_server}/export/pdf/${
      this.i18nStore.activeLang
    }`
  }

  constructor(
    private certifiedStore: CertifiedStoreService,
    private i18nStore: I18nStore,
    private mainStore: MainStore,
    private message: MessageService,
    private http: HttpClient
  ) {}

  exportAs(format: "csv" | "xlsx", results: ISimpleHistoryResult[]) {
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

  exportAsPdf(results: ISimpleHistoryResult[]) {
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

  openCertifiedPdf(loopUuid?: string | null) {
    if (!this.basePdfUrl || !loopUuid) {
      return of(null)
    }
    this.mainStore.inProgress$.next(true)
    return this.http
      .post<any>(this.basePdfUrl, this.getFormData(loopUuid))
      .pipe(
        map((resp: any) => {
          if (resp?.["file"]) {
            const url = `${this.basePdfUrl}/${resp["file"]}`
            window.open(url, "_blank")
            return url
          }
          return null
        }),
        catchError(this.handleError),
        finalize(() => this.mainStore.inProgress$.next(false))
      )
  }

  private saveFile = (format: string) => (data: any) => {
    if (data?.body) saveAs(data.body, `${new Date().toISOString()}.${format}`)

    this.mainStore.inProgress$.next(false)
  }

  private handleError = () => {
    this.mainStore.inProgress$.next(false)
    this.message.openSnackbar(ERROR_OCCURED)
    return of(null)
  }

  private getFormData(loopUuid: string) {
    const dataForm = this.certifiedStore.dataForm()
    const envForm = this.certifiedStore.envForm()
    const formData = new FormData()
    const textFields = {
      location_type_other: "locationTypeOther",
      type_text: "typeText",
      test_device: "testDevice",
      title_prepend: "titlePrepend",
      first_name: "firstName",
      last_name: "lastName",
      title_append: "titleAppend",
      address: "address",
    }
    formData.append("loop_uuid", loopUuid)
    if (envForm?.locationType.length) {
      for (const [i, l] of Object.values(ECertifiedLocationType).entries()) {
        if (envForm.locationType.includes(l)) {
          formData.append(`location_type_${i}`, l)
        }
      }
    }
    for (const [targetField, srcField] of Object.entries(textFields)) {
      if ((envForm as any)?.[srcField]?.length > 0) {
        formData.append(targetField, (envForm as any)?.[srcField])
      } else if ((dataForm as any)?.[srcField]?.length > 0) {
        formData.append(targetField, (dataForm as any)?.[srcField])
      }
    }
    if (!!dataForm?.isFirstCycle) {
      formData.append("first", "y")
    } else {
      formData.append("first", "n")
    }
    if (envForm && Object.keys(envForm.testPictures).length > 0) {
      for (const file of Object.values(envForm.testPictures)) {
        formData.append("test_pictures[]", file)
      }
    }
    return formData
  }

  private getExportParams(format: string, results: ISimpleHistoryResult[]) {
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
