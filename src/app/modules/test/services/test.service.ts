import { Injectable, NgZone } from "@angular/core"
import { environment } from "../../../../environments/environment"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import tz from "dayjs/plugin/timezone"
import { IMeasurementPhaseState } from "../interfaces/measurement-phase-state.interface"
import { IBasicNetworkInfo } from "../interfaces/basic-network-info.interface"
import { EMeasurementStatus } from "../constants/measurement-status.enum"
import { TestStore } from "../store/test.store"
import { ITestVisualizationState } from "../interfaces/test-visualization-state.interface"
import { TestVisualizationState } from "../dto/test-visualization-state.dto"
import { BasicNetworkInfo } from "../dto/basic-network-info.dto"
import { UUID } from "../constants/strings"
import { MainStore } from "../../shared/store/main.store"
import { HistoryStore } from "../../history/store/history.store"
import { LoopStoreService } from "../../loop/store/loop-store.service"
import { OptionsStoreService } from "../../options/store/options-store.service"
import { GeoTrackerService } from "./geotracker.service"
import { STATE_UPDATE_TIMEOUT } from "../constants/numbers"
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

export const PING_INTERVAL_MILLISECONDS = 1000

@Injectable({
  providedIn: "root",
})
export class TestService {
  private lastState?: IMeasurementPhaseState & IBasicNetworkInfo
  private waitingTimer?: NodeJS.Timeout
  private worker?: Worker

  get isLoopModeEnabled() {
    return this.loopStore.isLoopModeEnabled()
  }

  constructor(
    private readonly historyStore: HistoryStore,
    private readonly geoTrackerService: GeoTrackerService,
    private readonly loopStore: LoopStoreService,
    private readonly mainStore: MainStore,
    private readonly ngZone: NgZone,
    private readonly testStore: TestStore,
    private readonly optionsStore: OptionsStoreService
  ) {}

  triggerNextIframeTest() {
    return this.triggerNextTest({
      referrer: document.referrer || "https://unknown.invalid",
    })
  }

  async triggerNextTest(options?: TestOptions) {
    clearInterval(this.waitingTimer)
    if (!this.loopStore.isLoopModeEnabled()) {
      this.loopStore.loopUuid.set(null)
    }
    this.worker = new Worker(new URL("./test-timer.worker", import.meta.url))
    this.worker.addEventListener("message", ({ data }) => {
      this.ngZone.run(() => {
        switch (data.type) {
          case "timer":
            this.lastState = data.state
            this.setTestState(data.state, this.testStore.visualization$.value)
            break
          case "error":
            this.mainStore.error$.next(data.error)
            break
        }
      })
    })
    const config = this.getConfig(options)
    const controlProxy = this.getControlProxy()
    if (controlProxy && controlProxy !== environment.api.baseUrl) {
      config["additionalRegistrationParameters"]["protocol_version"] =
        this.optionsStore.ipVersion()
    }
    this.geoTrackerService.startGeoTracking(console.log, (data) => {
      this.worker?.postMessage({
        type: "setLocation",
        coordinates: data,
      })
    })
    this.worker?.postMessage({
      type: "startTimer",
      config,
      controlProxy,
    })
    this.loopStore.lastTestStartedAt.set(Date.now())
  }

  stopUpdates() {
    this.worker?.terminate()
    this.worker = undefined
    clearInterval(this.waitingTimer)
    if (this.isLoopModeEnabled && !this.loopStore.maxTestsReached()) {
      this.waitingTimer = setInterval(() => {
        if (this.lastState) {
          this.setTestState(this.lastState, this.testStore.visualization$.value)
        }
      }, STATE_UPDATE_TIMEOUT)
    }
  }

  private getConfig(options?: { referrer?: string }) {
    const config: { [key: string]: any } = {}
    config["uuid"] = localStorage.getItem(UUID)
    config["timezone"] = dayjs.tz.guess()
    config["doPingIntervalMilliseconds"] = PING_INTERVAL_MILLISECONDS
    config["additionalRegistrationParameters"] = {}

    if (this.loopStore.isLoopModeEnabled()) {
      config["additionalRegistrationParameters"] = {
        loopmode_info: {
          max_delay: (this.loopStore.testIntervalMinutes() ?? 0) / 60,
          test_counter: this.loopStore.loopCounter(),
          max_tests: this.loopStore.maxTestsAllowed(),
        },
      }
      const loopUuid = this.loopStore.loopUuid()
      if (loopUuid) {
        config["additionalRegistrationParameters"].loopmode_info.loop_uuid =
          loopUuid
      }
    }

    if (options?.referrer) {
      config["additionalRegistrationParameters"]["referrer"] = options.referrer
    }
    return config
  }

  private getControlProxy() {
    let controlProxy = environment.api.baseUrl
    const ipv6Only = this.mainStore.api().control_ipv6_only
    const ipv4Only = this.mainStore.api().control_ipv4_only
    const storedIpVersion = this.optionsStore.ipVersion()
    if (storedIpVersion === "ipv6" && ipv6Only) {
      controlProxy = `https://${ipv6Only}`
    } else if (storedIpVersion === "ipv4" && ipv4Only) {
      controlProxy = `https://${ipv4Only}`
    }
    return controlProxy
  }

  private setTestState = (
    phaseState: IMeasurementPhaseState & IBasicNetworkInfo,
    oldVisualization: ITestVisualizationState
  ) => {
    if (this.isLoopModeEnabled && !this.loopStore.loopUuid()) {
      this.loopStore.loopUuid.set(phaseState.loopUuid)
    }
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
      this.loopStore.lastTestFinishedAt.set(Date.now())
      this.stopUpdates()
      this.geoTrackerService.stopGeoTracking()
      if (phaseState.phase === EMeasurementStatus.ERROR) {
        this.sendAbort(phaseState.testUuid)
        if (oldPhaseName === EMeasurementStatus.NOT_STARTED) {
          // Probably the server is not reachable
          this.optionsStore.ipVersion.set("default")
        }
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
    this.lastState = undefined
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
