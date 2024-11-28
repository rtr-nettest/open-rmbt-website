import { Injectable, NgZone } from "@angular/core"
import {
  BehaviorSubject,
  concatMap,
  from,
  interval,
  map,
  of,
  withLatestFrom,
} from "rxjs"
import { Router } from "@angular/router"
import { v4 } from "uuid"
import { EMeasurementStatus } from "../constants/measurement-status.enum"
import { ERoutes } from "../../shared/constants/routes.enum"
import { ILoopModeInfo } from "../interfaces/measurement-registration-request.interface"
import { IBasicNetworkInfo } from "../interfaces/basic-network-info.interface"
import { ITestVisualizationState } from "../interfaces/test-visualization-state.interface"
import { IMeasurementPhaseState } from "../interfaces/measurement-phase-state.interface"
import { ISimpleHistoryResult } from "../interfaces/simple-history-result.interface"
import { MessageService } from "../../shared/services/message.service"
import { I18nStore } from "../../i18n/store/i18n.store"
import { TestVisualizationState } from "../dto/test-visualization-state.dto"
import { TestPhaseState } from "../dto/test-phase-state.dto"
import { BasicNetworkInfo } from "../dto/basic-network-info.dto"
import { ICertifiedDataForm } from "../interfaces/certified-data-form.interface"
import { ICertifiedEnvForm } from "../interfaces/certified-env-form.interface"
import { environment } from "../../../../environments/environment"
import { HistoryStore } from "./history.store"

export const STATE_UPDATE_TIMEOUT = 175

@Injectable({
  providedIn: "root",
})
export class TestStore {
  basicNetworkInfo$ = new BehaviorSubject<IBasicNetworkInfo>(
    new BasicNetworkInfo()
  )
  error$ = new BehaviorSubject<Error | null>(null)
  visualization$ = new BehaviorSubject<ITestVisualizationState>(
    new TestVisualizationState()
  )
  simpleHistoryResult$ = new BehaviorSubject<ISimpleHistoryResult | null>(null)
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

  constructor(
    private i18nStore: I18nStore,
    private historyStore: HistoryStore,
    private message: MessageService,
    private ngZone: NgZone,
    private router: Router
  ) {
    window.electronAPI.onRestartMeasurement((loopCounter) => {
      this.ngZone.run(() => {
        this.loopCounter$.next(loopCounter)
      })
    })
    window.electronAPI.onLoopModeExpired(() => {
      this.ngZone.run(() => {
        const message = this.i18nStore.translate(
          "The loop measurement has expired"
        )
        this.message.openConfirmDialog(message, () => {
          this.router.navigate([
            "/",
            ERoutes.LOOP.split("/")[0],
            this.loopUuid$.value,
          ])
        })
      })
    })

    window.addEventListener("focus", this.setLatestTestState)

    window.electronAPI.onAppSuspended(() => {
      this.ngZone.run(() => {
        const message =
          "The app was suspended. The last running measurement was aborted"
        this.loopCounter$.next(this.loopCounter$.value + 1)
        this.message.openConfirmDialog(message, () => {
          if (!this.enableLoopMode$.value) {
            this.router.navigate(["/"])
          } else if (!this.isCertifiedMeasurement$.value) {
            this.router.navigate([ERoutes.LOOP])
          }
        })
      })
    })
  }

  launchTest() {
    this.resetState()
    if (!this.enableLoopMode$.value) {
      window.electronAPI.runMeasurement()
    }
    return interval(STATE_UPDATE_TIMEOUT).pipe(
      concatMap(() => from(window.electronAPI.getMeasurementState())),
      withLatestFrom(this.visualization$),
      map(([state, vis]) => this.setTestState(state, vis))
    )
  }

  private setTestState = (
    phaseState: IMeasurementPhaseState & IBasicNetworkInfo,
    oldVisualization: ITestVisualizationState
  ) => {
    const oldPhaseName = oldVisualization.currentPhaseName
    const oldPhaseIsOfFinishType =
      oldPhaseName === EMeasurementStatus.END ||
      oldPhaseName === EMeasurementStatus.ERROR ||
      oldPhaseName === EMeasurementStatus.ABORTED
    let newState
    if (phaseState.phase !== oldPhaseName && oldPhaseIsOfFinishType) {
      newState = new TestVisualizationState()
    } else {
      newState = oldVisualization
    }
    newState = TestVisualizationState.from(newState, phaseState)
    this.visualization$.next(newState)
    this.basicNetworkInfo$.next(phaseState)
    return newState
  }

  launchCertifiedTest() {
    const loopUuid = v4()
    const loopCounter = 1
    this.loopUuid$.next(loopUuid)
    this.loopCounter$.next(loopCounter)
    this.enableLoopMode$.next(true)
    this.isCertifiedMeasurement$.next(true)
    this.testIntervalMinutes$.next(environment.certifiedTests.interval)
    const loopModeInfo: ILoopModeInfo | undefined = {
      max_delay: this.testIntervalMinutes$.value ?? 0,
      max_tests: environment.certifiedTests.count,
      test_counter: loopCounter,
      loop_uuid: loopUuid,
    }
    window.electronAPI.onMaxTestsReached(() => this.maxTestsReached$.next(true))
    window.electronAPI.scheduleLoop(this.fullTestIntervalMs, loopModeInfo)
    return loopModeInfo
  }

  launchLoopTest(interval: number) {
    const loopUuid = v4()
    const loopCounter = 1
    this.loopUuid$.next(loopUuid)
    this.loopCounter$.next(loopCounter)
    this.enableLoopMode$.next(true)
    this.testIntervalMinutes$.next(interval)
    const loopModeInfo: ILoopModeInfo | undefined = {
      max_delay: this.testIntervalMinutes$.value ?? 0,
      test_counter: loopCounter,
      loop_uuid: loopUuid,
    }
    window.electronAPI.scheduleLoop(this.fullTestIntervalMs, loopModeInfo)
    this.router.navigate(["/", ERoutes.LOOP])
  }

  private setLatestTestState = () => {
    if (
      this.visualization$.value.currentPhaseName ===
      EMeasurementStatus.SHOWING_RESULTS
    ) {
      return
    }
    window.electronAPI.getMeasurementState().then((state) => {
      const v = this.visualization$.value
      this.setTestState(state, v)
      v.phases[EMeasurementStatus.DOWN].setChartFromPings?.(state.pings)
      v.phases[EMeasurementStatus.DOWN].setRTRChartFromOverallSpeed?.(
        state.downs
      )
      v.phases[EMeasurementStatus.UP].setRTRChartFromOverallSpeed?.(state.ups)
      this.visualization$.next(v)
      this.historyStore
        .getRecentMeasurementHistory({
          offset: 0,
          limit: this.loopCounter$.value - 1,
        })
        .subscribe()
    })
  }

  disableLoopMode() {
    this.enableLoopMode$.next(false)
    this.isCertifiedMeasurement$.next(false)
    this.maxTestsReached$.next(false)
    this.loopCounter$.next(1)
  }

  getMeasurementResult(testUuid: string | null) {
    if (!testUuid || this.error$.value) {
      return of(null)
    }
    return from(window.electronAPI.getMeasurementResult(testUuid)).pipe(
      map((result) => {
        this.simpleHistoryResult$.next(result)
        const newPhase = new TestPhaseState({
          phase: EMeasurementStatus.SHOWING_RESULTS,
          down: result.downloadKbit / 1000,
          up: result.uploadKbit / 1000,
          ping: result.ping / 1e6,
        })
        const newState = TestVisualizationState.fromHistoryResult(
          result,
          this.visualization$.value,
          newPhase
        )
        this.visualization$.next(newState)
        this.basicNetworkInfo$.next({
          serverName: result.measurementServerName,
          ipAddress: result.ipAddress,
          providerName: result.providerName,
        })
        return result
      })
    )
  }

  private resetState() {
    this.basicNetworkInfo$.next(new BasicNetworkInfo())
    this.visualization$.next(new TestVisualizationState())
    this.simpleHistoryResult$.next(null)
    this.error$.next(null)
  }
}
