import { Component } from "@angular/core"
import { ERoutes } from "../../../shared/constants/routes.enum"
import { imports } from "../../../test/screens/test-screen/test-screen.component"
import { Step3Component as LoopScreenComponent } from "../../../loop/screens/step-3/step-3.component"
import { environment } from "../../../../../environments/environment"

@Component({
  selector: "app-step-4",
  standalone: true,
  imports,
  templateUrl: "../../../test/screens/test-screen/test-screen.component.html",
  styleUrl: "../../../test/screens/test-screen/test-screen.component.scss",
})
export class Step4Component extends LoopScreenComponent {
  override goBackLocation: string = ""

  override abortTest(): void {
    this.stopped$.next()
    this.loopService.cancelLoop()
    this.router.navigate([this.i18nStore.activeLang, ERoutes.CERTIFIED_RESULT])
  }

  override scheduleLoop() {
    this.loopService.scheduleLoop({
      isCertifiedMeasurement: true,
      maxTestsAllowed: environment.loopModeDefaults.max_tests,
      testIntervalMinutes: environment.loopModeDefaults.max_delay,
    })
  }
}
