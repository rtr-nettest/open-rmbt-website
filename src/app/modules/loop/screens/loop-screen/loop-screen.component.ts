import { Component, inject } from "@angular/core"
import {
  imports,
  TestScreenComponent,
} from "../../../test/screens/test-screen/test-screen.component"
import {
  BehaviorSubject,
  distinctUntilChanged,
  map,
  takeUntil,
  withLatestFrom,
} from "rxjs"
import { EMeasurementStatus } from "../../../test/constants/measurement-status.enum"
import { ITestVisualizationState } from "../../../test/interfaces/test-visualization-state.interface"
import { ERROR_OCCURED_DURING_LOOP } from "../../constants/strings"
import { STATE_UPDATE_TIMEOUT } from "../../../test/constants/numbers"
import { LoopService } from "../../services/loop.service"
import { ERoutes } from "../../../shared/constants/routes.enum"
import { setGoBackLocation } from "../../../shared/util/nav"

@Component({
  selector: "app-loop-screen",
  standalone: true,
  imports,
  templateUrl: "../../../test/screens/test-screen/test-screen.component.html",
  styleUrl: "../../../test/screens/test-screen/test-screen.component.scss",
})
export class LoopScreenComponent extends TestScreenComponent {
  override goBackLocation: string = `/${this.i18nStore.activeLang}/${ERoutes.LOOP_1}`
  protected readonly loopService = inject(LoopService)
  protected waitingProgressMs = 0
  protected shouldGetHistory$ = new BehaviorSubject<boolean>(false)
  protected currentTestUuid$ = new BehaviorSubject<string | null>(null)

  override initVisualization(): void {
    this.visualization$ = this.store.visualization$.pipe(
      withLatestFrom(this.mainStore.error$, this.loopCount$),
      distinctUntilChanged(),
      map(([state, error, loopCount]) => {
        if (error) {
          this.openErrorDialog(state)
        } else if (state.currentPhaseName === EMeasurementStatus.END) {
          this.goToResult(state)
        } else {
          this.getRecentHistory(loopCount)
        }
        this.checkIfNewTestStarted(
          state.phases[state.currentPhaseName].testUuid
        )
        this.checkIfWaiting(state)
        return state
      })
    )
    this.loopCount$
      .pipe(distinctUntilChanged(), takeUntil(this.stopped$))
      .subscribe(() => {
        this.service.triggerNextTest()
      })
    this.scheduleLoop()
  }

  protected scheduleLoop() {
    this.loopService.scheduleLoop()
  }

  override ngOnInit(): void {
    super.ngOnInit()
    this.ngZone.run(() => {
      this.getRecentHistory(this.loopStore.loopCounter())
    })
  }

  override abortTest(): void {
    this.stopped$.next()
    this.service.abortMeasurement()
    this.loopService.cancelLoop()
    setGoBackLocation(this.goBackLocation)
    this.router.navigate([this.i18nStore.activeLang, ERoutes.LOOP_RESULT], {
      queryParams: { loop_uuid: this.loopStore.loopUuid() },
    })
  }

  private checkIfNewTestStarted(testUuid: string) {
    const lastTestUuid = this.currentTestUuid$.value
    if (lastTestUuid !== testUuid) {
      // New test started
      this.currentTestUuid$.next(testUuid)
      this.loopWaiting$.next(false)
      this.waitingProgressMs = 0
    }
  }

  protected override openErrorDialog(state: ITestVisualizationState) {
    this.message.closeAllDialogs()
    const message =
      this.i18nStore.translate(ERROR_OCCURED_DURING_LOOP) +
      " " +
      this.loopStore.loopCounter()
    this.message.openConfirmDialog(message, () => void 0)
    this.goToResult(state)
  }

  protected override goToResult = (_: ITestVisualizationState) => {
    if (this.loopStore.maxTestsReached()) {
      this.abortTest()
      return
    }
    // Waiting for a new test to start
    this.service.updateEndTime()
    this.loopWaiting$.next(true)
    this.shouldGetHistory$.next(true)
    this.mainStore.error$.next(null)
  }

  private getRecentHistory(loopCount: number) {
    if (!this.shouldGetHistory$.value) {
      return
    }
    this.historyService
      .getRecentMeasurementHistory({
        offset: 0,
        limit: loopCount - 1,
      })
      .subscribe()
    this.shouldGetHistory$.next(false)
  }

  private checkIfWaiting(state: ITestVisualizationState) {
    const fullIntervalMs = this.loopStore.fullTestIntervalMs()
    if (!this.loopWaiting$.value || fullIntervalMs == null) {
      return
    }
    this.waitingProgressMs += STATE_UPDATE_TIMEOUT
    const endTimeMs = state.endTimeMs
    const timeTillEndMs = state.startTimeMs + fullIntervalMs - endTimeMs
    const currentMs = Math.max(0, timeTillEndMs - this.waitingProgressMs + 1000)
    if (currentMs <= 0 || currentMs > fullIntervalMs) {
      this.progressMode$.next("indeterminate")
    } else {
      this.progressMode$.next("determinate")
      this.ms$.next(currentMs)
      this.progress$.next((this.waitingProgressMs / timeTillEndMs) * 100)
    }
  }
}
