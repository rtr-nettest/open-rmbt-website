import { Component, inject } from "@angular/core"
import { ERoutes } from "../../../shared/constants/routes.enum"
import { imports } from "../../../test/screens/test-screen/test-screen.component"
import { Step3Component as LoopScreenComponent } from "../../../loop/screens/step-3/step-3.component"
import { environment } from "../../../../../environments/environment"
import { CertifiedStoreService } from "../../store/certified-store.service"
import { ITestVisualizationState } from "../../../test/interfaces/test-visualization-state.interface"
import { TOO_FAST_FOR_FIREFOX } from "../../../loop/constants/strings"

@Component({
  selector: "app-step-4",
  standalone: true,
  imports,
  templateUrl: "../../../test/screens/test-screen/test-screen.component.html",
  styleUrl: "../../../test/screens/test-screen/test-screen.component.scss",
})
export class Step4Component extends LoopScreenComponent {
  private readonly certifiedStore = inject(CertifiedStoreService)

  override initVisualization(): void {
    if (this.certifiedStore.testStartDisabled()) {
      this.testStartDisabled.set(true)
    } else {
      this.testStartDisabled.set(false)
      super.initVisualization()
    }
  }

  override abortTest(options?: { showPopup: boolean }): void {
    this.stopped$.next()
    this.loopService.cancelLoop()
    if (options?.showPopup) {
      this.message.openConfirmDialog(
        this.i18nStore.translate(TOO_FAST_FOR_FIREFOX),
        () => this.router.navigate([this.i18nStore.activeLang]),
        {
          canCancel: false,
        }
      )
    } else {
      this.router.navigate([
        this.i18nStore.activeLang,
        ERoutes.CERTIFIED_RESULT,
      ])
    }
  }

  override goToResult = (s: ITestVisualizationState) => {
    const { down, up } = s.phases[s.currentPhaseName]
    const isFirefox = navigator.userAgent.toLowerCase().includes("firefox")
    if (
      isFirefox &&
      (down >= environment.certifiedDefaults.max_speed_firefox_mbps ||
        up >= environment.certifiedDefaults.max_speed_firefox_mbps)
    ) {
      this.loopStore.maxTestsReached.set(true)
      this.testService.stopUpdates()
      this.abortTest({
        showPopup: true,
      })
      return
    }
    if (this.loopStore.maxTestsReached()) {
      this.abortTest()
      return
    }
    // Waiting for a new test to start
    this.loopWaiting.set(true)
    this.shouldGetHistory$.next(true)
    this.mainStore.error$.next(null)
  }

  override scheduleLoop() {
    this.loopService.scheduleLoop({
      isCertifiedMeasurement: true,
      maxTestsAllowed: environment.certifiedDefaults.max_tests,
      testIntervalMinutes: environment.certifiedDefaults.max_delay,
    })
  }
}
