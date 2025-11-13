import { Component, HostListener, inject } from "@angular/core"
import {
  imports,
  TestScreenComponent,
} from "../../../test/screens/test-screen/test-screen.component"
import {
  distinctUntilChanged,
  filter,
  firstValueFrom,
  map,
  takeUntil,
  withLatestFrom,
} from "rxjs"
import { EMeasurementStatus } from "../../../test/constants/measurement-status.enum"
import { ITestVisualizationState } from "../../../test/interfaces/test-visualization-state.interface"
import { STATE_UPDATE_TIMEOUT } from "../../../test/constants/numbers"
import { LoopService } from "../../services/loop.service"
import { ERoutes } from "../../../shared/constants/routes.enum"
import { environment } from "../../../../../environments/environment"
import { toObservable } from "@angular/core/rxjs-interop"
import { CertifiedStoreService } from "../../../certified/store/certified-store.service"
import dayjs from "dayjs"
import { RESULT_DATE_FORMAT } from "../../../test/constants/strings"
import { IMeasurementPhaseState } from "../../../test/interfaces/measurement-phase-state.interface"
import { IBasicNetworkInfo } from "../../../test/interfaces/basic-network-info.interface"

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
  override nextRoute = ERoutes.LOOP_3
  override excludeColumns =
    environment.loopModeDefaults.exclude_from_result ?? []
  protected readonly loopService = inject(LoopService)
  protected waitingProgressMs = 0
  protected currentTestUuid: string | null = null
  protected readonly certifiedStore = inject(CertifiedStoreService)
  lastTestFinishedAt$ = toObservable(this.loopStore.lastTestFinishedAt)
  finishedTests = 0
  testsFinishedWhileActive = 0
  private triggeredOnSchedule = false
  private lastState?: IMeasurementPhaseState & IBasicNetworkInfo
  private waitingTimer?: NodeJS.Timeout

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
    if (
      this.loopStore.activeBreadcrumbIndex() == null &&
      this.certifiedStore.activeBreadcrumbIndex() == null
    ) {
      this.router.navigate([this.i18nStore.activeLang, ERoutes.LOOP_1])
      return
    }
    document.addEventListener("visibilitychange", this.tabActivityListener)
    this.visualization$ = this.store.visualization$.pipe(
      withLatestFrom(this.mainStore.error$, this.loopCount$),
      distinctUntilChanged(),
      map(([state, error, _]) => {
        if (
          this.connectivity.isOnline() &&
          (error || state.currentPhaseName === EMeasurementStatus.END) // offline is handled separately
        ) {
          this.goToResult(state)
        }
        this.checkIfNewTestStarted(
          state.phases[state.currentPhaseName].testUuid
        )
        this.checkIfWaiting(state)
        return state
      })
    )
    this.watchLoops()
    this.scheduleLoop()
  }

  private watchLoops() {
    this.loopCount$
      .pipe(
        filter((v) => v > 0),
        distinctUntilChanged(),
        takeUntil(this.stopped$)
      )
      .subscribe((count) => {
        if (count > this.loopStore.maxTestsAllowed()) {
          this.abortTest()
          return
        }
        if (this.connectivity.isOnline()) {
          this.handleOnline()
          this.triggerNextTest()
        } else {
          this.triggeredOnSchedule = true
          this.handleOffline()
        }
      })
  }

  private triggerNextTest() {
    this.estimatedEndTime.set(
      new Date(this.loopStore.estimatedEndTime() as number)
    )
    this.service.triggerNextTest({
      beforeStart: () => {
        clearInterval(this.waitingTimer)
        this.loopStore.lastTestFinishedAt.set(0)
        this.lastState = undefined
      },
      afterFinish: () => {
        clearInterval(this.waitingTimer)
        this.loopStore.lastTestFinishedAt.set(Date.now())
        this.waitingTimer = setInterval(() => {
          if (
            this.loopStore.loopCounter() >= this.loopStore.maxTestsAllowed()
          ) {
            this.loopStore.maxTestsReached.set(true)
            clearInterval(this.waitingTimer)
            this.goToResult(this.testStore.visualization$.value)
            return
          }
          if (!this.lastState) {
            return
          }
          this.testService.setTestState(
            this.lastState,
            this.testStore.visualization$.value
          )
        }, STATE_UPDATE_TIMEOUT)
      },
      onStateUpdate: (state) => {
        this.lastState = state
        if (!this.loopStore.loopUuid()) {
          this.loopStore.loopUuid.set(state.loopUuid)
        }
      },
    })
  }

  protected scheduleLoop() {
    this.loopService.scheduleLoop({
      isCertifiedMeasurement: false,
      maxTestsAllowed: this.loopStore.maxTestsAllowed(),
      testIntervalMinutes: this.loopStore.testIntervalMinutes(),
    })
    this.watchFinishedTests()
  }

  protected watchFinishedTests() {
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
        this.setHistory()
      })
  }

  private async setHistory() {
    let content = this.result()?.content || []
    try {
      const history = await firstValueFrom(
        this.historyService.getLoopHistory(this.loopStore.loopUuid()!)
      )
      content = [
        ...content.filter(
          (entry) => entry.openTestResponse?.["status"] !== "finished"
        ),
        ...history.content.filter(
          (entry) => entry.openTestResponse?.["status"] === "finished"
        ),
      ].sort(
        (a, b) =>
          dayjs(b.measurementDate).toDate().getTime() -
          dayjs(a.measurementDate).toDate().getTime()
      )
    } catch (err) {
      console.error("Error fetching loop history:", err)
      content.unshift({
        measurementDate: dayjs(
          new Date(this.loopStore.lastTestStartedAt())
        ).format(RESULT_DATE_FORMAT),
        measurementServerName: "",
        providerName: "",
        ipAddress: "",
        openTestResponse: {
          status: "error",
        },
      })
    }
    this.result.set({ content, totalElements: content.length })
  }

  override abortTest(): void {
    this.stopped$.next()
    this.loopService.cancelLoop()
    history.replaceState(
      {},
      "",
      `/${this.i18nStore.activeLang}/${ERoutes.HOME}`
    )
    this.router.navigate([this.i18nStore.activeLang, ERoutes.LOOP_RESULT])
  }

  private checkIfNewTestStarted(testUuid: string) {
    if (this.currentTestUuid !== testUuid) {
      this.currentTestUuid = testUuid
      // Reset waiting state
      this.loopWaiting.set(false)
      this.waitingProgressMs = 0
    }
  }

  protected override goToResult = (_: ITestVisualizationState) => {
    if (this.loopStore.maxTestsReached()) {
      this.abortTest()
      return
    }
    // Waiting for a new test to start
    this.loopWaiting.set(true)
    this.mainStore.error$.next(null)
  }

  protected override openErrorDialog(state: ITestVisualizationState): void {
    this.waitingProgressMs = 0
    this.goToResult(state)
  }

  protected override handleOffline(): void {
    if (!this.loopWaiting()) {
      // Stop the test after a timeout and trigger openErrorDialog
      super.handleOffline()
      return
    }
    if (this.triggeredOnSchedule) {
      this.triggeredOnSchedule = false
      // Stop the test immediately and mock start of a new test
      this.waitingProgressMs = 0
      this.service.stopUpdates() // this will trigger afterFinish in scheduleLoop
      this.loopStore.lastTestStartedAt.set(Date.now())
    }
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

  @HostListener("window:beforeunload", ["$event"])
  override preventReload(event: BeforeUnloadEvent) {
    event.preventDefault()
    event.returnValue = true
    this.loopService.pauseLoop()
    return true
  }

  @HostListener("window:focus")
  resumeLoop() {
    this.loopService.resumeLoop()
  }
}
