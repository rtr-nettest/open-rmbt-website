import { Component, inject } from "@angular/core"
import {
  imports,
  TestScreenComponent,
} from "../../../test/screens/test-screen/test-screen.component"
import {
  BehaviorSubject,
  distinctUntilChanged,
  filter,
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
import { environment } from "../../../../../environments/environment"
import { toObservable } from "@angular/core/rxjs-interop"

@Component({
  selector: "app-step-3",
  standalone: true,
  imports,
  templateUrl: "../../../test/screens/test-screen/test-screen.component.html",
  styleUrl: "../../../test/screens/test-screen/test-screen.component.scss",
})
export class Step3Component extends TestScreenComponent {
  override addMedian = true
  override currentRoute: string | null = ERoutes.LOOP_1
  override excludeColumns =
    environment.loopModeDefaults.exclude_from_result ?? []
  protected readonly loopService = inject(LoopService)
  protected waitingProgressMs = 0
  protected shouldGetHistory$ = new BehaviorSubject<boolean>(false)
  protected currentTestUuid$ = new BehaviorSubject<string | null>(null)
  lastTestFinishedAt$ = toObservable(this.loopStore.lastTestFinishedAt)
  finishedTests = 0
  testsFinishedWhileActive = 0

  tabActivityListener = () => {
    if (!document.hidden) {
      this.testsFinishedWhileActive = this.finishedTests = 0
      this.ts.setTitle(this.metaTitle)
    }
  }

  override ngOnDestroy(): void {
    document.removeEventListener("visibilitychange", this.tabActivityListener)
    super.ngOnDestroy()
  }

  override initVisualization(): void {
    document.addEventListener("visibilitychange", this.tabActivityListener)
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
      .pipe(
        filter((v) => v > 0),
        distinctUntilChanged(),
        takeUntil(this.stopped$)
      )
      .subscribe(() => {
        this.service.triggerNextTest()
      })
    this.lastTestFinishedAt$
      .pipe(
        filter((v) => v > 0),
        distinctUntilChanged(),
        takeUntil(this.stopped$)
      )
      .subscribe(() => {
        this.finishedTests++
        if (!document.hidden) {
          this.testsFinishedWhileActive++
        }
        const diff = this.finishedTests - this.testsFinishedWhileActive
        if (document.hidden && diff > 0) {
          this.ts.setTitle(`(${diff}) ${this.metaTitle}`)
        }
      })
    this.scheduleLoop()
  }

  protected scheduleLoop() {
    this.loopService.scheduleLoop({
      isCertifiedMeasurement: false,
      maxTestsAllowed: this.loopStore.maxTestsAllowed(),
      testIntervalMinutes: this.loopStore.testIntervalMinutes(),
    })
  }

  override abortTest(): void {
    this.stopped$.next()
    this.loopService.cancelLoop()
    this.router.navigate([this.i18nStore.activeLang, ERoutes.LOOP_RESULT])
  }

  private checkIfNewTestStarted(testUuid: string) {
    const lastTestUuid = this.currentTestUuid$.value
    if (lastTestUuid !== testUuid) {
      // New test started
      this.currentTestUuid$.next(testUuid)
      this.loopWaiting.set(false)
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
    this.loopWaiting.set(true)
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
    if (!this.loopWaiting() || fullIntervalMs == null) {
      return
    }
    this.waitingProgressMs += STATE_UPDATE_TIMEOUT
    const endTimeMs = this.loopStore.lastTestFinishedAt()
    const timeTillEndMs =
      this.loopStore.lastTestStartedAt() + fullIntervalMs - endTimeMs
    const currentMs = Math.max(0, timeTillEndMs - this.waitingProgressMs + 1000)
    if (currentMs <= 0 || currentMs > fullIntervalMs) {
      this.progressMode.set("indeterminate")
    } else {
      this.progressMode.set("determinate")
      this.progressMs.set(currentMs)
      this.progress.set((this.waitingProgressMs / timeTillEndMs) * 100)
    }
  }
}
