import {
  Inject,
  Injectable,
  isDevMode,
  NgZone,
  PLATFORM_ID,
} from "@angular/core"
import { IUserSetingsResponse } from "../interfaces/user-settings-response.interface"
import { environment } from "../../../../environments/environment"
import {
  concatMap,
  from,
  interval,
  map,
  Observable,
  of,
  Subscription,
  withLatestFrom,
} from "rxjs"
import { isPlatformBrowser } from "@angular/common"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import tz from "dayjs/plugin/timezone"
import { IMeasurementPhaseState } from "../interfaces/measurement-phase-state.interface"
import { IBasicNetworkInfo } from "../interfaces/basic-network-info.interface"
import { EMeasurementStatus } from "../constants/measurement-status.enum"
import { IOverallResult } from "../../history/interfaces/overall-result.interface"
import { TestStore } from "../store/test.store"
import { ITestVisualizationState } from "../interfaces/test-visualization-state.interface"
import { TestVisualizationState } from "../dto/test-visualization-state.dto"
import { Router } from "@angular/router"
import { BasicNetworkInfo } from "../dto/basic-network-info.dto"
import { UUID } from "../constants/strings"
import { STATE_UPDATE_TIMEOUT } from "../constants/numbers"
import { MainStore } from "../../shared/store/main.store"
import { HistoryStore } from "../../history/store/history.store"
import { SettingsService } from "../../shared/services/settings.service"
import { LoopStoreService } from "../../loop/store/loop-store.service"
import { RmbtwsDelegateService } from "./rmbtws-delegate.service"
dayjs.extend(utc)
dayjs.extend(tz)

@Injectable({
  providedIn: "root",
})
export class TestService {
  private downs: IOverallResult[] = []
  private ups: IOverallResult[] = []
  private rmbtws: any
  private startTimeMs = 0
  private endTimeMs = 0
  private stateChangeMs = 0
  private visUpdateSub?: Subscription

  constructor(
    private readonly historyStore: HistoryStore,
    private readonly loopStore: LoopStoreService,
    private readonly mainStore: MainStore,
    private readonly ngZone: NgZone,
    private readonly settingsService: SettingsService,
    private readonly testStore: TestStore,
    private readonly rmbtwsDelegate: RmbtwsDelegateService,
    @Inject(PLATFORM_ID) private readonly platformId: object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      import("rmbtws" as any).then((rmbtws) => {
        this.rmbtws = rmbtws
        if (!this.rmbtws.TestEnvironment) {
          this.rmbtws = rmbtws.default
          return
        }
      })
    }
  }

  launchTests() {
    this.resetState()
    if (!isPlatformBrowser(this.platformId) || !this.rmbtws) {
      console.error("RMBTws not loaded")
      return
    }
    this.ngZone.runOutsideAngular(() => {
      this.triggerNextTest()
    })
  }

  triggerNextTest() {
    this.rmbtws.TestEnvironment.init(this.rmbtwsDelegate, null)
    const config = new this.rmbtws.RMBTTestConfig(
      "en",
      environment.api.baseUrl,
      `RMBTControlServer`
    )
    config.uuid = localStorage.getItem(UUID)
    config.timezone = dayjs.tz.guess()
    if (this.loopStore.isLoopModeEnabled())
      config.additionalRegistrationParameters = {
        loopmode_info: {
          max_delay: (this.loopStore.testIntervalMinutes() ?? 0) / 60,
          test_counter: this.loopStore.loopCounter(),
          max_tests: this.loopStore.maxTestsAllowed(),
          loop_uuid: this.loopStore.loopUuid(),
        },
      }
    const rmbtTest = new this.rmbtws.RMBTTest(
      config,
      new this.rmbtws.RMBTControlServerCommunication(config)
    )
    rmbtTest.onStateChange(() => {
      this.stateChangeMs = Date.now()
    })
    rmbtTest.onError((error: any) => {
      this.ngZone.run(() => {
        this.mainStore.error$.next(error)
      })
    })
    this.startTimeMs = Date.now()
    rmbtTest.startTest()
    this.visUpdateSub?.unsubscribe()
    this.visUpdateSub = interval(STATE_UPDATE_TIMEOUT)
      .pipe(
        concatMap(() => from(this.getMeasurementState(rmbtTest))),
        withLatestFrom(this.testStore.visualization$),
        map(([state, vis]) => {
          this.ngZone.run(() => {
            this.setTestState(state, vis)
          })
        })
      )
      .subscribe()
  }

  updateEndTime() {
    this.endTimeMs = this.stateChangeMs
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
    this.testStore.visualization$.next(newState)
    this.testStore.basicNetworkInfo.set(phaseState)
    return newState
  }

  private resetState() {
    this.testStore.basicNetworkInfo.set(new BasicNetworkInfo())
    this.testStore.visualization$.next(new TestVisualizationState())
    this.historyStore.simpleHistoryResult$.next(null)
    this.mainStore.error$.next(null)
    this.downs = []
    this.ups = []
    this.startTimeMs = 0
    this.endTimeMs = 0
    this.visUpdateSub?.unsubscribe()
  }

  getSettings(): Observable<IUserSetingsResponse> {
    if (!isPlatformBrowser(this.platformId)) {
      return of({ settings: [] } as unknown as IUserSetingsResponse)
    }
    return this.settingsService.getSettings()
  }

  async getMeasurementState(
    rmbtTest: any
  ): Promise<IMeasurementPhaseState & IBasicNetworkInfo> {
    const result = rmbtTest?.getIntermediateResult()
    const basicInfo = this.testStore.basicNetworkInfo()
    const diffTimeMs = Date.now() - this.stateChangeMs
    const phase: EMeasurementStatus =
      result?.status?.toString() ?? EMeasurementStatus.NOT_STARTED
    const down =
      result?.downBitPerSec && result.downBitPerSec !== -1
        ? (result.downBitPerSec as number) / 1e6
        : -1
    if (down >= 0 && phase === EMeasurementStatus.DOWN) {
      this.downs.push({
        speed: result.downBitPerSec,
        bytes: 0,
        nsec: diffTimeMs * 1e6,
      })
    }
    const up =
      result?.upBitPerSec && result.upBitPerSec !== -1
        ? (result.upBitPerSec as number) / 1e6
        : -1
    if (up >= 0 && phase === EMeasurementStatus.UP) {
      this.ups.push({
        speed: result.upBitPerSec,
        bytes: 0,
        nsec: diffTimeMs * 1e6,
      })
    }
    const ping =
      result?.pingNano && result?.pingNano !== -1
        ? Math.round((result.pingNano as number) / 1e6)
        : -1
    const pings = []
    if (phase === EMeasurementStatus.DOWN && result.pings) {
      const startTimeNs = result.pings[0]?.timeNs || 0
      for (const p of result.pings) {
        pings.push({
          value_server: p.server,
          value: p.client,
          time_ns: p.timeNs - startTimeNs,
        })
      }
    }

    return {
      duration: diffTimeMs / 1e3,
      progress: result.progress,
      time: Date.now(),
      ping,
      pings,
      down,
      downs: this.downs ?? [],
      up,
      ups: this.ups ?? [],
      phase,
      testUuid: basicInfo.testUuid ?? "",
      openTestUuid: basicInfo.openTestUuid ?? "",
      ipAddress: basicInfo.ipAddress ?? "-",
      serverName: basicInfo.serverName ?? "-",
      providerName: basicInfo.providerName ?? "-",
      coordinates: basicInfo.coordinates,
      startTimeMs: this.startTimeMs,
      endTimeMs: this.endTimeMs,
    }
  }

  abortMeasurement() {
    // TODO: cancel on WS side
  }
}
