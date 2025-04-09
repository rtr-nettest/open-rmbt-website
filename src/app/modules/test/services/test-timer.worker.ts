/// <reference lib="webworker" />

import { IOverallResult } from "../../history/interfaces/overall-result.interface"
import { EMeasurementStatus } from "../constants/measurement-status.enum"
import { STATE_UPDATE_TIMEOUT } from "../constants/numbers"
import { BasicNetworkInfo } from "../dto/basic-network-info.dto"
import { IBasicNetworkInfo } from "../interfaces/basic-network-info.interface"
import { IMeasurementPhaseState } from "../interfaces/measurement-phase-state.interface"
import { RmbtwsDelegateService } from "./rmbtws-delegate.service"

let worker: TestTimerWorker | undefined

addEventListener("message", ({ data }) => {
  switch (data.type) {
    case "startTimer":
      worker = new TestTimerWorker(data.config, data.controlProxy)
      worker.triggerNextTest()
      break
  }
})

class TestTimerWorker {
  private basicNetworkInfo: IBasicNetworkInfo = new BasicNetworkInfo()
  private downs: IOverallResult[] = []
  private ups: IOverallResult[] = []
  private startTimeMs = 0
  private endTimeMs = 0
  private stateChangeMs = 0
  private rmbtTest: any
  private loopUuid = ""
  private interval: NodeJS.Timeout | null = null

  constructor(private config: any, private readonly controlProxy: string) {}

  async triggerNextTest(): Promise<void> {
    let rmbtws = await import("rmbtws/dist/esm/rmbtws.min.js" as any)
    if (!rmbtws.TestEnvironment) {
      rmbtws = rmbtws.default
    }
    if (!rmbtws) {
      this.handleError("RMBT WebSocket library not found")
      return
    }
    rmbtws.log.disable()

    rmbtws.TestEnvironment.init(
      new RmbtwsDelegateService(
        () => this.basicNetworkInfo,
        (v) => (this.basicNetworkInfo = v)
      ),
      null
    )

    this.config = Object.assign(
      new rmbtws.RMBTTestConfig("en", this.controlProxy, `RMBTControlServer`),
      this.config
    )

    const communication = new rmbtws.RMBTControlServerCommunication(
      this.config,
      {
        register: (data: any) => {
          if (data.response["loop_uuid"]) {
            this.loopUuid = data.response["loop_uuid"]
          }
        },
      }
    )
    this.startTest(rmbtws, this.config, communication)
    this.watchForUpdates()
  }

  private watchForUpdates() {
    clearInterval(this.interval as NodeJS.Timeout)
    this.interval = setInterval(async () => {
      const state = await this.getMeasurementState()
      postMessage({ type: "timer", state })
    }, STATE_UPDATE_TIMEOUT)
  }

  private async getMeasurementState(): Promise<
    IMeasurementPhaseState & IBasicNetworkInfo
  > {
    const result = this.rmbtTest?.getIntermediateResult()
    const basicInfo = this.basicNetworkInfo
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
        ? (result.pingNano as number) / 1e6
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
      loopUuid: this.loopUuid,
    }
  }

  private startTest(rmbtws: any, config: any, communication: any) {
    this.rmbtTest = new rmbtws.RMBTTest(config, communication)
    this.rmbtTest.onStateChange(() => {
      this.stateChangeMs = Date.now()
    })
    this.rmbtTest.onError((error: any) => {
      if (error) this.handleError(error)
    })
    this.startTimeMs = Date.now()
    this.rmbtTest.startTest()
  }

  private handleError(error: any) {
    postMessage({
      type: "error",
      message: error.message || error,
    })
  }
}
