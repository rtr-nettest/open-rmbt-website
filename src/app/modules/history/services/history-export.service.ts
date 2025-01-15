import { Injectable } from "@angular/core"
import { BehaviorSubject, catchError, concatMap, map, of, tap } from "rxjs"
import { HttpClient, HttpParams } from "@angular/common/http"
import saveAs from "file-saver"
import { I18nStore } from "../../i18n/store/i18n.store"
import { ISimpleHistoryResult } from "../../history/interfaces/simple-history-result.interface"
import { environment } from "../../../../environments/environment"
import { MessageService } from "../../shared/services/message.service"
import { MainStore } from "../../shared/store/main.store"
import { TestStore } from "../../test/store/test.store"
import { ECertifiedLocationType } from "../../certified/interfaces/certified-env-form.interface"
import { ERROR_OCCURED } from "../../test/constants/strings"

@Injectable({
  providedIn: "root",
})
export class HistoryExportService {
  lastCertifiedPdfUrl$ = new BehaviorSubject("")

  private get exportUrl() {
    return `${this.mainStore.api().url_web_statistic_server}/export`
  }

  private get pdfUrl() {
    if (!this.exportUrl) {
      return null
    }
    return this.exportUrl + "/pdf/" + this.i18nStore.activeLang
  }

  constructor(
    private i18nStore: I18nStore,
    private mainStore: MainStore,
    private message: MessageService,
    private testStore: TestStore,
    private http: HttpClient
  ) {}

  exportAs(format: "csv" | "xlsx", results: ISimpleHistoryResult[]) {
    const exportUrl = `${environment.api.baseUrl}/RMBTStatisticServer/opentests/search`
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
    if (!this.pdfUrl) {
      return of(null)
    }
    this.mainStore.inProgress$.next(true)
    return this.http
      .post(this.pdfUrl, this.getExportParams("pdf", results))
      .pipe(
        concatMap(this.downloadPdf),
        tap(this.saveFile("pdf")),
        catchError(this.handleError)
      )
  }

  exportAsCertified(loopUuid?: string | null) {
    if (this.lastCertifiedPdfUrl$.value) {
      //   window.electronAPI.openPdf(this.lastCertifiedPdfUrl$.value)
      return this.lastCertifiedPdfUrl$.asObservable()
    }
    if (!this.pdfUrl || !loopUuid) {
      return of(null)
    }
    this.mainStore.inProgress$.next(true)
    return this.http
      .post<any>(this.pdfUrl, this.getFormData(loopUuid))
      .pipe(
        concatMap(this.downloadPdf),
        tap(this.saveFile("pdf")),
        catchError(this.handleError)
      )
  }

  getCertifiedPdfUrl(loopUuid?: string | null) {
    if (!this.pdfUrl || !loopUuid) {
      return of(null)
    }
    return this.http.post<any>(this.pdfUrl, this.getFormData(loopUuid)).pipe(
      map((resp: any) => {
        if (resp?.["file"]) {
          const fileUrl = this.exportUrl + "/pdf/" + resp["file"]
          this.lastCertifiedPdfUrl$.next(fileUrl)
          return fileUrl
        }
        return null
      }),
      catchError(this.handleError)
    )
  }

  private downloadPdf = (resp: any) => {
    if (resp?.["file"]) {
      return this.http.get(this.exportUrl + "/pdf/" + resp["file"], {
        responseType: "blob",
        observe: "response",
      })
    }
    return of(null)
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
    const dataForm = this.testStore.certifiedDataForm$.value
    const envForm = this.testStore.certifiedEnvForm$.value
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
    formData.append("loop_uuid", "L" + loopUuid)
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
