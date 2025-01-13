import { computed, Injectable, signal } from "@angular/core"
import { I18nStore } from "../../i18n/store/i18n.store"
import { ERoutes } from "../../shared/constants/routes.enum"
import { ESteps } from "../constants/steps.enum"

@Injectable({
  providedIn: "root",
})
export class CertifiedStoreService {
  activeBreadcrumbIndex = signal(0)
  breadcrumbs = computed(() => {
    return [
      {
        index: ESteps.INFO,
        label: "Info",
        route: `/${this.i18nStore.activeLang}/${ERoutes.CERTIFIED}`,
      },
      {
        index: ESteps.DATA,
        label: "Data",
        route: `/${this.i18nStore.activeLang}/${ERoutes.CERTIFIED_2}`,
      },
      {
        index: ESteps.ENVIRONMENT,
        label: "Environment",
        route: `/${this.i18nStore.activeLang}/${ERoutes.CERTIFIED_3}`,
      },
      {
        index: ESteps.MEASUREMENT,
        label: "Measurement",
        route: `/${this.i18nStore.activeLang}/${ERoutes.CERTIFIED_4}`,
      },
      {
        index: ESteps.RESULT,
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
  isReady = signal(false)
  isDataFormValid = signal(false)
  isEnvFormValid = signal(false)
  nextStepAvailable = computed(() => {
    return (
      this.activeBreadcrumbIndex() === ESteps.INFO ||
      (!this.isReady() && this.activeBreadcrumbIndex() < ESteps.ENVIRONMENT)
    )
  })
  testStartAvailable = computed(() => {
    return (
      (this.isReady() &&
        this.activeBreadcrumbIndex() != ESteps.INFO &&
        this.activeBreadcrumbIndex() < ESteps.MEASUREMENT) ||
      this.activeBreadcrumbIndex() == ESteps.ENVIRONMENT
    )
  })
  testStartDisabled = computed(() => {
    return this.activeBreadcrumbIndex() == ESteps.ENVIRONMENT
      ? !this.isEnvFormValid
      : !this.isDataFormValid
  })

  constructor(private readonly i18nStore: I18nStore) {}
}
