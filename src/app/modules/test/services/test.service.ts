import { Inject, Injectable, NgZone, PLATFORM_ID } from "@angular/core"
import { environment } from "../../../../environments/environment"
import {
  concatMap,
  from,
  interval,
  map,
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
import { BasicNetworkInfo } from "../dto/basic-network-info.dto"
import { UUID } from "../constants/strings"
import { STATE_UPDATE_TIMEOUT } from "../constants/numbers"
import { MainStore } from "../../shared/store/main.store"
import { HistoryStore } from "../../history/store/history.store"
import { LoopStoreService } from "../../loop/store/loop-store.service"
import { RmbtwsDelegateService } from "./rmbtws-delegate.service"
import { MessageService } from "../../shared/services/message.service"
dayjs.extend(utc)
dayjs.extend(tz)

export type TestOptions = {
  referrer?: string
}

declare global {
  interface Window {
    _submissionCallback: any
    _registrationCallback: any
  }
}

@Injectable({
  providedIn: "root",
})
export class TestService {
  private downs: IOverallResult[] = []
  private ups: IOverallResult[] = []
  private startTimeMs = 0
  private endTimeMs = 0
  private stateChangeMs = 0
  private worker?: Worker

  constructor(
    private readonly historyStore: HistoryStore,
    private readonly loopStore: LoopStoreService,
    private readonly mainStore: MainStore,
    private readonly message: MessageService,
    private readonly ngZone: NgZone,
    private readonly testStore: TestStore,
    @Inject(PLATFORM_ID) private readonly platformId: object
  ) {}

  triggerNextIframeTest() {
    return this.triggerNextTest({
      referrer: document.referrer || "https://unknown.invalid",
    })
  }

  async triggerNextTest(options?: TestOptions) {
    let rmbtws = await import("rmbtws/dist/esm/rmbtws.min.js" as any)
    if (!rmbtws.TestEnvironment) {
      rmbtws = rmbtws.default
    }
    if (!isPlatformBrowser(this.platformId) || !rmbtws) {
      this.message.openSnackbar("Error loading test environment")
      return
    }
    if (!this.loopStore.isLoopModeEnabled()) {
      this.loopStore.loopUuid.set(null)
    }

    this.ngZone.runOutsideAngular(() => {
      rmbtws.TestEnvironment.init(
        new RmbtwsDelegateService(
          () => this.testStore.basicNetworkInfo(),
          (v) => this.testStore.basicNetworkInfo.set(v)
        ),
        null
      )
      const config = this.getConfig(rmbtws, options)
      const communication = new rmbtws.RMBTControlServerCommunication(config, {
        register: (data: any) => {
          if (data.response["loop_uuid"]) {
            this.loopStore.loopUuid.set(data.response["loop_uuid"])
          }
        },
      })
      const rmbtTest = this.startTest(rmbtws, config, communication)
      this.watchForUpdates(rmbtTest)
    })
  }

  stopUpdates() {
    this.worker?.terminate()
  }

  updateEndTime() {
    this.endTimeMs = this.stateChangeMs
    this.testStore.lastTestFinishedAt.set(Date.now())
  }

  private getConfig(rmbtws: any, options?: { referrer?: string }) {
    const config = new rmbtws.RMBTTestConfig(
      "en",
      environment.api.baseUrl,
      `RMBTControlServer`
    )
    config.uuid = localStorage.getItem(UUID)
    config.timezone = dayjs.tz.guess()

    if (this.loopStore.isLoopModeEnabled()) {
      config.additionalRegistrationParameters = {
        loopmode_info: {
          max_delay: (this.loopStore.testIntervalMinutes() ?? 0) / 60,
          test_counter: this.loopStore.loopCounter(),
          max_tests: this.loopStore.maxTestsAllowed(),
        },
      }
      const loopUuid = this.loopStore.loopUuid()
      if (loopUuid) {
        config.additionalRegistrationParameters.loopmode_info.loop_uuid =
          loopUuid
      }
    }

    if (options?.referrer) {
      config.additionalRegistrationParameters["referrer"] = options.referrer
    }

    return config
  }

  private startTest(rmbtws: any, config: any, communication: any) {
    const rmbtTest = new rmbtws.RMBTTest(config, communication)
    rmbtTest.onStateChange(() => {
      this.stateChangeMs = Date.now()
    })
    rmbtTest.onError((error: any) => {
      this.ngZone.run(() => {
        if (error) this.mainStore.error$.next(error)
      })
    })
    this.startTimeMs = Date.now()
    rmbtTest.startTest()
    return rmbtTest
  }

  private watchForUpdates(rmbtTest: any) {
    this.stopUpdates()
    this.worker = new Worker(new URL("./test-timer.worker", import.meta.url))
    this.worker.addEventListener("message", (event) => {
      if (event.data.type === "timer") {
        this.ngZone.run(() => {
          this.getMeasurementState(rmbtTest).then((state) => {
            this.ngZone.run(() => {
              this.setTestState(state, this.testStore.visualization$.value)
            })
          })
        })
      }
    })
    this.worker.postMessage({
      type: "startTimer",
      payload: STATE_UPDATE_TIMEOUT,
    })
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
    const newPhaseIsOfFinishType =
      phaseState.phase === EMeasurementStatus.END ||
      phaseState.phase === EMeasurementStatus.ERROR ||
      phaseState.phase === EMeasurementStatus.ABORTED
    if (newPhaseIsOfFinishType && phaseState.phase !== oldPhaseName) {
      this.updateEndTime()
      if (phaseState.phase === EMeasurementStatus.ERROR) {
        this.sendAbort(phaseState.testUuid)
      }
    }
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

  resetState() {
    this.testStore.basicNetworkInfo.set(new BasicNetworkInfo())
    this.testStore.visualization$.next(new TestVisualizationState())
    this.historyStore.simpleHistoryResult$.next(null)
    this.mainStore.error$.next(null)
    this.downs = []
    this.ups = []
    this.startTimeMs = 0
    this.endTimeMs = 0
    this.stopUpdates()
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

  getProgressSegment(status: EMeasurementStatus, progress: number) {
    var ProgressSegmentsTotal = 96
    var ProgressSegmentsInit = 1
    var ProgressSegmentsInitDown = 13
    var ProgressSegmentsPing = 15
    var ProgressSegmentsDown = 34
    var ProgressSegmentsInitUp = 4
    var ProgressSegmentsUp = 29
    var progressSegments = 0
    switch (status) {
      case EMeasurementStatus.INIT:
        progressSegments = +Math.round(ProgressSegmentsInit * progress)
        break
      case EMeasurementStatus.INIT_DOWN:
        progressSegments =
          ProgressSegmentsInit + Math.round(ProgressSegmentsInitDown * progress)
        break
      case EMeasurementStatus.PING:
        progressSegments =
          ProgressSegmentsInit +
          ProgressSegmentsInitDown +
          Math.round(ProgressSegmentsPing * progress)
        break
      case EMeasurementStatus.DOWN:
        progressSegments =
          ProgressSegmentsInit +
          ProgressSegmentsInitDown +
          ProgressSegmentsPing +
          Math.round(ProgressSegmentsDown * progress)
        break
      case EMeasurementStatus.INIT_UP:
        progressSegments =
          ProgressSegmentsInit +
          ProgressSegmentsInitDown +
          ProgressSegmentsPing +
          ProgressSegmentsDown +
          Math.round(ProgressSegmentsInitUp * progress)
        break
      case EMeasurementStatus.UP:
        progressSegments =
          ProgressSegmentsInit +
          ProgressSegmentsInitDown +
          ProgressSegmentsPing +
          ProgressSegmentsDown +
          ProgressSegmentsInitUp +
          Math.round(ProgressSegmentsUp * progress)
        progressSegments = Math.min(95, progressSegments)
        break
      case EMeasurementStatus.SUBMITTING_RESULTS:
      case EMeasurementStatus.END:
        progressSegments = ProgressSegmentsTotal
        break
      case EMeasurementStatus.QOS_TEST_RUNNING:
        progressSegments = 95
        break
      case EMeasurementStatus.SPEEDTEST_END:
      case EMeasurementStatus.QOS_END:
        progressSegments = 95
        break
      case EMeasurementStatus.ERROR:
      case EMeasurementStatus.ABORTED:
        progressSegments = 0
        break
    }
    return Math.round((progressSegments / ProgressSegmentsTotal) * 100)
  }

  sendAbort(testUuid: string | undefined) {
    navigator.sendBeacon(
      `${environment.api.baseUrl}/RMBTControlServer/resultUpdate`,
      JSON.stringify({
        uuid: localStorage.getItem(UUID),
        test_uuid: testUuid,
        aborted: true,
      })
    )
  }
}
