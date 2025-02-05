import { Component } from "@angular/core"
import { LoopScreenComponent } from "../../../loop/screens/loop-screen/loop-screen.component"
import { ERoutes } from "../../../shared/constants/routes.enum"
import { imports } from "../../../test/screens/test-screen/test-screen.component"
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

  override abortTest(): void {
    this.stopped$.next()
    this.loopService.cancelLoop()
    this.router.navigate(
      [this.i18nStore.activeLang, ERoutes.CERTIFIED_RESULT],
      {
        queryParams: { loop_uuid: this.loopStore.loopUuid() },
      }
    )
  }

  override scheduleLoop() {
    this.loopService.scheduleLoop({
      intervalMinutes: environment.certifiedTests.interval,
      isCertifiedMeasurement: true,
    })
  }
}
