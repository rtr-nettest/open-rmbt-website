import { Injectable } from "@angular/core"
import { BehaviorSubject } from "rxjs"
import { IBasicNetworkInfo } from "../interfaces/basic-network-info.interface"
import { ITestVisualizationState } from "../interfaces/test-visualization-state.interface"
import { TestVisualizationState } from "../dto/test-visualization-state.dto"
import { BasicNetworkInfo } from "../dto/basic-network-info.dto"
import { ICertifiedDataForm } from "../interfaces/certified-data-form.interface"
import { ICertifiedEnvForm } from "../interfaces/certified-env-form.interface"

@Injectable({
  providedIn: "root",
})
export class TestStore {
  basicNetworkInfo$ = new BehaviorSubject<IBasicNetworkInfo>(
    new BasicNetworkInfo()
  )
  visualization$ = new BehaviorSubject<ITestVisualizationState>(
    new TestVisualizationState()
  )
  testIntervalMinutes$ = new BehaviorSubject<number | null>(null)
  enableLoopMode$ = new BehaviorSubject<boolean>(false)
  isCertifiedMeasurement$ = new BehaviorSubject<boolean>(false)
  loopCounter$ = new BehaviorSubject<number>(1)
  loopUuid$ = new BehaviorSubject<string | null>(null)
  maxTestsReached$ = new BehaviorSubject<boolean>(false)
  certifiedDataForm$ = new BehaviorSubject<ICertifiedDataForm | null>(null)
  certifiedEnvForm$ = new BehaviorSubject<ICertifiedEnvForm | null>(null)

  get fullTestIntervalMs() {
    return this.testIntervalMinutes$.value! * 60 * 1000
  }

  constructor() {
    // TODO: Loop mode
    // window.electronAPI.onRestartMeasurement((loopCounter) => {
    //   this.ngZone.run(() => {
    //     this.loopCounter$.next(loopCounter)
    //   })
    // })
    // window.electronAPI.onLoopModeExpired(() => {
    //   this.ngZone.run(() => {
    //     const message = this.i18nStore.translate(
    //       "The loop measurement has expired"
    //     )
    //     this.message.openConfirmDialog(message, () => {
    //       this.router.navigate([
    //         "/",
    //         ERoutes.LOOP.split("/")[0],
    //         this.loopUuid$.value,
    //       ])
    //     })
    //   })
    // })
    // window.addEventListener("focus", this.setLatestTestState)
    // TODO: is this needed?
    // window.electronAPI.onAppSuspended(() => {
    //   this.ngZone.run(() => {
    //     const message =
    //       "The app was suspended. The last running measurement was aborted"
    //     this.loopCounter$.next(this.loopCounter$.value + 1)
    //     this.message.openConfirmDialog(message, () => {
    //       if (!this.enableLoopMode$.value) {
    //         this.router.navigate(["/"])
    //       } else if (!this.isCertifiedMeasurement$.value) {
    //         this.router.navigate([ERoutes.LOOP])
    //       }
    //     })
    //   })
    // })
  }
}
