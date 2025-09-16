import { inject, Injectable } from "@angular/core"
import { HistoryExportService } from "../../history/services/history-export.service"
import { CertifiedStoreService } from "../store/certified-store.service"
import { catchError, finalize, map, of } from "rxjs"
import { ECertifiedLocationType } from "../interfaces/certified-env-form.interface"

@Injectable({
  providedIn: "root",
})
export class CertifiedExportService extends HistoryExportService {
  private certifiedStore = inject(CertifiedStoreService)

  openCertifiedPdf(loopUuid?: string | null) {
    if (!this.quickPdfUrl || !loopUuid) {
      return of(null)
    }
    this.mainStore.inProgress$.next(true)
    return this.http
      .post<any>(this.quickPdfUrl, this.getCertifiedFormData(loopUuid))
      .pipe(
        map((resp: any) => {
          if (resp?.["file"]) {
            const url = `${this.quickPdfUrl}/${resp["file"]}`
            window.open(url, "_blank")
            return url
          }
          return null
        }),
        catchError(this.handleError),
        finalize(() => this.mainStore.inProgress$.next(false))
      )
  }

  private getCertifiedFormData(loopUuid: string) {
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
    const locationType = envForm?.locationType ?? []
    if (locationType.length) {
      for (const [i, l] of Object.values(ECertifiedLocationType).entries()) {
        if (locationType[i]) {
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
    if (envForm) {
      formData.append("first", "y")
    } else {
      formData.append("first", "n")
    }
    if (envForm?.testPictures && Object.keys(envForm.testPictures).length > 0) {
      for (const file of Object.values(envForm.testPictures)) {
        formData.append("test_pictures[]", file, file.name)
      }
    }
    return formData
  }
}
