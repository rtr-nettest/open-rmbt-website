import { Component } from "@angular/core"
import { LoopScreenComponent } from "../../../loop/screens/loop-screen/loop-screen.component"
import { ERoutes } from "../../../shared/constants/routes.enum"
import { setGoBackLocation } from "../../../shared/util/nav"
import { imports } from "../../../test/screens/test-screen/test-screen.component"
import { ITestVisualizationState } from "../../../test/interfaces/test-visualization-state.interface"
import { environment } from "../../../../../environments/environment"

@Component({
  selector: "app-step-4",
  standalone: true,
  imports,
  templateUrl: "../../../test/screens/test-screen/test-screen.component.html",
  styleUrl: "../../../test/screens/test-screen/test-screen.component.scss",
})
export class Step4Component extends LoopScreenComponent {
  override goBackLocation: string = `/${this.i18nStore.activeLang}/${ERoutes.CERTIFIED_1}`

  override ngOnInit() {
    this.loopService.enableLoopMode(environment.certifiedTests.interval, true)
    super.ngOnInit()
  }

  override abortTest(): void {
    this.stopped$.next()
    this.service.abortMeasurement()
    this.loopService.cancelLoop()
    setGoBackLocation(this.goBackLocation)
    this.router.navigate(
      [this.i18nStore.activeLang, ERoutes.CERTIFIED_RESULT],
      {
        queryParams: { loop_uuid: this.loopStore.loopUuid() },
      }
    )
  }

  override goToResult = (_: ITestVisualizationState) => {
    if (
      this.loopStore.isCertifiedMeasurement() &&
      this.loopStore.maxTestsReached()
    ) {
      this.abortTest()
      return
    }

    // Waiting for a new test to start
    this.service.updateEndTime()
    this.loopWaiting$.next(true)
    this.shouldGetHistory$.next(true)
    this.mainStore.error$.next(null)
  }
}
