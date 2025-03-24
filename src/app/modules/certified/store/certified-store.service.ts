import { computed, effect, Injectable, signal } from "@angular/core"
import { I18nStore } from "../../i18n/store/i18n.store"
import { ERoutes } from "../../shared/constants/routes.enum"
import { ECertifiedSteps } from "../constants/certified-steps.enum"
import { ICertifiedDataForm } from "../interfaces/certified-data-form.interface"
import { ICertifiedEnvForm } from "../interfaces/certified-env-form.interface"
import { IBreadcrumb } from "../../shared/interfaces/breadcrumb.interface"
import { DATA_FORM, ENV_FORM } from "../constants/strings"

@Injectable({
  providedIn: "root",
})
export class CertifiedStoreService {
  activeBreadcrumbIndex = signal(0)
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
        route: `/${this.i18nStore.activeLang}/${ERoutes.TEST}`,
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
        visited: index < this.activeBreadcrumbIndex(),
      }))
      .sort((a, b) => a.index - b.index)
  })
  dataForm = signal<ICertifiedDataForm | null>(null)
  envForm = signal<ICertifiedEnvForm | null>(null)
  isReady = signal(false)
  isDataFormValid = signal(false)
  isEnvFormValid = signal(false)
  nextStepAvailable = computed(() => {
    return (
      this.activeBreadcrumbIndex() === ECertifiedSteps.INFO ||
      (!this.isReady() &&
        this.activeBreadcrumbIndex() < ECertifiedSteps.ENVIRONMENT)
    )
  })
  testStartAvailable = computed(() => {
    return (
      (this.isReady() &&
        this.activeBreadcrumbIndex() != ECertifiedSteps.INFO &&
        this.activeBreadcrumbIndex() < ECertifiedSteps.MEASUREMENT) ||
      this.activeBreadcrumbIndex() == ECertifiedSteps.ENVIRONMENT
    )
  })
  testStartDisabled = computed(() => {
    return this.activeBreadcrumbIndex() == ECertifiedSteps.ENVIRONMENT
      ? !this.isEnvFormValid()
      : !this.isDataFormValid()
  })

  constructor(private readonly i18nStore: I18nStore) {
    if (globalThis.localStorage) {
      const dataForm = localStorage.getItem(DATA_FORM)
      if (dataForm) {
        this.dataForm.set(JSON.parse(dataForm))
      }
      const envForm = localStorage.getItem(ENV_FORM)
      if (envForm) {
        this.envForm.set(JSON.parse(envForm))
      }
      effect(() => {
        const dataForm = this.dataForm()
        const envForm = this.envForm()
        if (dataForm) {
          localStorage.setItem(DATA_FORM, JSON.stringify(dataForm))
        } else {
          localStorage.removeItem(DATA_FORM)
        }
        if (envForm) {
          localStorage.setItem(ENV_FORM, JSON.stringify(envForm))
        } else {
          localStorage.removeItem(ENV_FORM)
        }
      })
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
