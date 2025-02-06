import { computed, inject, Injectable, signal } from "@angular/core"
import { environment } from "../../../../environments/environment"
import { IBreadcrumb } from "../../shared/interfaces/breadcrumb.interface"
import { I18nStore } from "../../i18n/store/i18n.store"
import { ERoutes } from "../../shared/constants/routes.enum"
import { ELoopSteps } from "../constants/certified-steps.enum"

@Injectable({
  providedIn: "root",
})
export class LoopStoreService {
  i18nStore = inject(I18nStore)
  activeBreadcrumbIndex = signal(0)
  breadcrumbs = computed<IBreadcrumb[]>(() => {
    return [
      {
        index: ELoopSteps.INFO,
        label: "Info",
        route: `/${this.i18nStore.activeLang}/${ERoutes.LOOP_1}`,
      },
      {
        index: ELoopSteps.SETTINGS,
        label: "Settings",
        route: `/${this.i18nStore.activeLang}/${ERoutes.LOOP_2}`,
      },
      {
        index: ELoopSteps.MEASUREMENT,
        label: "Measurement",
        route: `/${this.i18nStore.activeLang}/${ERoutes.LOOP_3}`,
      },
      {
        index: ELoopSteps.RESULT,
        label: "Result",
        route: `/${this.i18nStore.activeLang}/${ERoutes.LOOP_RESULT}`,
      },
    ]
      .map((link, index) => ({
        ...link,
        active: index === this.activeBreadcrumbIndex(),
        visited: index < this.activeBreadcrumbIndex(),
      }))
      .sort((a, b) => a.index - b.index)
  })
  loopUuid = signal<string | null>(null)
  loopCounter = signal<number>(-1)
  isLoopModeEnabled = signal<boolean>(false)
  testIntervalMinutes = signal<number>(environment.loopModeDefaults.max_delay)
  fullTestIntervalMs = computed(() =>
    this.testIntervalMinutes() ? this.testIntervalMinutes()! * 60 * 1000 : null
  )
  estimatedEndTime = computed(() => {
    const singleTestDuration = this.fullTestIntervalMs()
    if (!singleTestDuration) {
      return null
    }
    return Date.now() + singleTestDuration * this.maxTestsAllowed()
  })
  isCertifiedMeasurement = signal<boolean>(false)
  maxTestsAllowed = signal<number>(environment.loopModeDefaults.max_tests)
  maxTestsReached = signal<boolean>(false)
}
