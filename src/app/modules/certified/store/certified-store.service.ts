import { computed, effect, Injectable, signal } from "@angular/core"
import { I18nStore } from "../../i18n/store/i18n.store"
import { ERoutes } from "../../shared/constants/routes.enum"
import { ECertifiedSteps } from "../constants/certified-steps.enum"
import { ICertifiedDataForm } from "../interfaces/certified-data-form.interface"
import { ICertifiedEnvForm } from "../interfaces/certified-env-form.interface"
import { IBreadcrumb } from "../../shared/interfaces/breadcrumb.interface"
import { DATA_FORM, ENV_FORM } from "../constants/strings"

const CERTIFIED_CACHE = "certified-test-pictures"

@Injectable({
  providedIn: "root",
})
export class CertifiedStoreService {
  activeBreadcrumbIndex = signal<number | null>(null)
  breadcrumbs = computed<IBreadcrumb[]>(() => {
    return [
      {
        index: ECertifiedSteps.INFO,
        label: "Info",
        route: `/${this.i18nStore.activeLang}/${ERoutes.CERTIFIED_1}`,
      },
      {
        index: ECertifiedSteps.DATA,
        label: "Data",
        route: `/${this.i18nStore.activeLang}/${ERoutes.CERTIFIED_2}`,
      },
      {
        index: ECertifiedSteps.ENVIRONMENT,
        label: "Environment",
        route: `/${this.i18nStore.activeLang}/${ERoutes.CERTIFIED_3}`,
      },
      {
        index: ECertifiedSteps.MEASUREMENT,
        label: "Measurement",
        route: `/${this.i18nStore.activeLang}/${ERoutes.CERTIFIED_4}`,
      },
      {
        index: ECertifiedSteps.RESULT,
        label: "Result",
        route: `/${this.i18nStore.activeLang}/${ERoutes.CERTIFIED_RESULT}`,
      },
    ]
      .map((link, index) => ({
        ...link,
        active: index === this.activeBreadcrumbIndex(),
        visited: index < (this.activeBreadcrumbIndex() ?? 0),
      }))
      .sort((a, b) => a.index - b.index)
  })
  dataForm = signal<ICertifiedDataForm | null>(null)
  envForm = signal<ICertifiedEnvForm | null>(null)
  isReady = signal(false)
  isDataFormValid = signal(false)
  isEnvFormValid = signal(false)

  constructor(private readonly i18nStore: I18nStore) {
    if (globalThis.sessionStorage) {
      const dataForm = sessionStorage.getItem(DATA_FORM)
      if (dataForm) {
        this.dataForm.set(JSON.parse(dataForm))
      }
      const envForm = sessionStorage.getItem(ENV_FORM)
      if (envForm) {
        const parsedEnvForm: ICertifiedEnvForm = JSON.parse(envForm)
        this.getFilesFromCache(parsedEnvForm.testPictures).then((files) => {
          if (files) {
            parsedEnvForm.testPictures = files
          }
          this.envForm.set(parsedEnvForm)
        })
      }
      effect(() => {
        const dataForm = this.dataForm()
        const envForm = this.envForm()
        if (dataForm) {
          sessionStorage.setItem(DATA_FORM, JSON.stringify(dataForm))
        } else {
          sessionStorage.removeItem(DATA_FORM)
        }
        if (envForm) {
          sessionStorage.setItem(ENV_FORM, JSON.stringify(envForm))
          this.saveFilesToCache(envForm.testPictures)
        } else {
          sessionStorage.removeItem(ENV_FORM)
        }
      })
    }
  }

  addFile(uuid: string, file: File) {
    const form = this.envForm()!
    const files = form.testPictures ?? {}
    files[uuid] = file
    this.envForm.set({ ...form, testPictures: files })
    console.log("Added file", uuid, file, this.envForm())
  }

  deleteFile(uuid: string) {
    const form = this.envForm()!
    const files = form.testPictures ?? {}
    delete files[uuid]
    this.envForm.set({ ...form, testPictures: files })
  }

  private async getFilesFromCache(testPictures: Record<string, File>) {
    if (!testPictures) {
      return
    }
    const cache = await caches.open(CERTIFIED_CACHE)
    const retVal: Record<string, File> = {}
    for (const key in testPictures) {
      const response = await cache.match(key)
      if (response?.ok) {
        const blob = await response.blob()
        const headers = response.headers
        retVal[key] = new File([blob], headers.get("File-Name") || key, {
          type: headers.get("Content-Type") || blob.type,
        })
      }
    }
    return retVal
  }

  private async saveFilesToCache(testPictures: Record<string, File>) {
    const cache = await caches.open(CERTIFIED_CACHE)
    const keys = await cache.keys()
    keys.forEach((key) => {
      cache.delete(key)
    })
    if (!testPictures) {
      return
    }
    for (const [key, file] of Object.entries(testPictures)) {
      const response = new Response(file, {
        headers: {
          "Content-Type": file.type,
          "File-Name": file.name,
        },
      })
      cache.put(key, response)
    }
  }

  reset() {
    this.dataForm.set(null)
    this.envForm.set(null)
    this.isReady.set(false)
    this.isDataFormValid.set(false)
    this.isEnvFormValid.set(false)
  }
}
