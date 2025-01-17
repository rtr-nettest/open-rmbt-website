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
import { v4 } from "uuid"
import { TestStore } from "../store/test.store"
import { ITestVisualizationState } from "../interfaces/test-visualization-state.interface"
import { TestVisualizationState } from "../dto/test-visualization-state.dto"
import { ILoopModeInfo } from "../interfaces/measurement-registration-request.interface"
import { Router } from "@angular/router"
import { ERoutes } from "../../shared/constants/routes.enum"
import { BasicNetworkInfo } from "../dto/basic-network-info.dto"
import { TestRepositoryService } from "../repository/test-repository.service"
import { UUID } from "../constants/strings"
import { STATE_UPDATE_TIMEOUT } from "../constants/numbers"
import { MainStore } from "../../shared/store/main.store"
import { HistoryStore } from "../../history/store/history.store"
dayjs.extend(utc)
dayjs.extend(tz)

@Injectable({
  providedIn: "root",
})
export class TestService {
  private coordinates?: [number, number]
  private downs: IOverallResult[] = []
  private ups: IOverallResult[] = []
  private rmbtws: any
  private rmbtTest: any
  private startTimeMs = 0
  private endTimeMs = 0
  private serverName?: string
  private remoteIp?: string
  private providerName?: string
  private testUuid?: string
  private stateChangeMs = 0
  private openTestUuid?: string

  constructor(
    private readonly historyStore: HistoryStore,
    private readonly mainStore: MainStore,
    private readonly ngZone: NgZone,
    private readonly repo: TestRepositoryService,
    private readonly router: Router,
    private readonly testStore: TestStore,
    @Inject(PLATFORM_ID) private readonly platformId: object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      if (isDevMode()) {
        import("rmbtws/dist/rmbtws.js" as any).then((rmbtws) => {
          this.rmbtws = rmbtws
        })
      } else {
        import("rmbtws" as any).then((rmbtws) => {
          this.rmbtws = rmbtws.default
        })
      }
    }
  }

  launchTest() {
    this.resetState()
    if (!isPlatformBrowser(this.platformId) || !this.rmbtws) {
      console.error("RMBTws not loaded")
      return of(null)
    }
    if (!this.testStore.enableLoopMode$.value) {
      this.ngZone.runOutsideAngular(() => {
        this.rmbtws.TestEnvironment.init(this, null)
        const config = new this.rmbtws.RMBTTestConfig(
          "en",
          environment.api.baseUrl,
          `RMBTControlServer`
        )
        config.uuid = localStorage.getItem(UUID)
        config.timezone = dayjs.tz.guess()
        config.additionalSubmissionParameters = { network_type: 0 }
        const ctrl = new this.rmbtws.RMBTControlServerCommunication(config)

        this.startTimeMs = Date.now()
        this.rmbtTest = new this.rmbtws.RMBTTest(config, ctrl)
        this.rmbtTest.startTest()
        this.rmbtTest.onStateChange(() => {
          this.stateChangeMs = Date.now()
        })
        this.rmbtTest.onError((error: any) => {
          this.ngZone.run(() => {
            this.mainStore.error$.next(error)
          })
        })
        // To not trigger console errors
        this.rmbtTest._registrationCallback = () => {}
        this.rmbtTest._submissionCallback = () => {}
      })
    }
    return interval(STATE_UPDATE_TIMEOUT).pipe(
      concatMap(() => from(this.getMeasurementState())),
      withLatestFrom(this.testStore.visualization$),
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
    this.testStore.visualization$.next(newState)
    this.testStore.basicNetworkInfo$.next(phaseState)
    return newState
  }

  launchCertifiedTest() {
    const loopUuid = v4()
    const loopCounter = 1
    this.testStore.loopUuid$.next(loopUuid)
    this.testStore.loopCounter$.next(loopCounter)
    this.testStore.enableLoopMode$.next(true)
    this.testStore.isCertifiedMeasurement$.next(true)
    this.testStore.testIntervalMinutes$.next(
      environment.certifiedTests.interval
    )
    const loopModeInfo: ILoopModeInfo | undefined = {
      max_delay: this.testStore.testIntervalMinutes$.value ?? 0,
      max_tests: environment.certifiedTests.count,
      test_counter: loopCounter,
      loop_uuid: loopUuid,
    }
    // TODO: Certified measurements
    // window.electronAPI.onMaxTestsReached(() => this.maxTestsReached$.next(true))
    // window.electronAPI.scheduleLoop(this.fullTestIntervalMs, loopModeInfo)
    return loopModeInfo
  }

  launchLoopTest(interval: number) {
    const loopUuid = v4()
    const loopCounter = 1
    this.testStore.loopUuid$.next(loopUuid)
    this.testStore.loopCounter$.next(loopCounter)
    this.testStore.enableLoopMode$.next(true)
    this.testStore.testIntervalMinutes$.next(interval)
    const loopModeInfo: ILoopModeInfo | undefined = {
      max_delay: this.testStore.testIntervalMinutes$.value ?? 0,
      test_counter: loopCounter,
      loop_uuid: loopUuid,
    }
    // TODO: Loop mode
    // window.electronAPI.scheduleLoop(this.fullTestIntervalMs, loopModeInfo)
    this.router.navigate(["/", ERoutes.LOOP])
  }

  disableLoopMode() {
    this.testStore.enableLoopMode$.next(false)
    this.testStore.isCertifiedMeasurement$.next(false)
    this.testStore.maxTestsReached$.next(false)
    this.testStore.loopCounter$.next(1)
  }

  private resetState() {
    this.testStore.basicNetworkInfo$.next(new BasicNetworkInfo())
    this.testStore.visualization$.next(new TestVisualizationState())
    this.historyStore.simpleHistoryResult$.next(null)
    this.mainStore.error$.next(null)
    this.downs = []
    this.ups = []
    this.startTimeMs = 0
    this.endTimeMs = 0
    this.serverName = undefined
    this.remoteIp = undefined
    this.providerName = undefined
    this.testUuid = undefined
  }

  getSettings(): Observable<IUserSetingsResponse> {
    if (!isPlatformBrowser(this.platformId)) {
      return of({ settings: [] } as unknown as IUserSetingsResponse)
    }
    return this.repo.getSettings()
  }

  async getMeasurementState(): Promise<
    IMeasurementPhaseState & IBasicNetworkInfo
  > {
    const result = this.rmbtTest?.getIntermediateResult()
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
      testUuid: this.testUuid ?? "",
      openTestUuid: this.openTestUuid ?? "",
      ipAddress: this.remoteIp ?? "-",
      serverName: this.serverName ?? "-",
      providerName: this.providerName ?? "-",
      coordinates: this.coordinates,
      startTimeMs: this.startTimeMs,
      endTimeMs: this.endTimeMs,
    }
  }

  updateStartTime() {
    this.startTimeMs = this.endTimeMs || this.startTimeMs
    this.endTimeMs = Date.now()
  }

  abortMeasurement() {
    // TODO:
  }

  /** RMBTws delegate */
  draw() {}

  updateInfo(
    serverName: string,
    remoteIp: string,
    providerName: string,
    testUuid: string,
    openTestUuid: string
  ) {
    this.serverName = serverName
    this.remoteIp = remoteIp
    this.providerName = providerName
    this.testUuid = testUuid
    this.openTestUuid = openTestUuid
  }

  setLocation(lat: number, lon: number) {
    this.coordinates = [lon, lat]
  }
  /** End RMBTws delegate */
}
