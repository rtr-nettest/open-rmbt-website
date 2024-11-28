import dayjs from "dayjs"
import { STATE_UPDATE_TIMEOUT } from "../store/test.store"
import { ITestPhaseState } from "../interfaces/test-phase-state.interface"
import { ETestStatuses } from "../constants/test-statuses.enum"
import { EMeasurementStatus } from "../constants/measurement-status.enum"
import { IPing } from "../interfaces/measurement-result.interface"
import { IOverallResult } from "../interfaces/overall-result.interface"
import { ConversionService } from "../../shared/services/conversion.service"

export class TestPhaseState implements ITestPhaseState {
  counter: number = -1
  testUuid: string = ""
  down: number = -1
  up: number = -1
  ping: number = -1
  chart?: { x: number; y: number }[] | undefined
  container?: ETestStatuses | undefined
  duration: number = 0
  progress: number = 0
  phase: EMeasurementStatus = EMeasurementStatus.NOT_STARTED
  label?: string | undefined
  time: number = -1
  pings: IPing[] = []
  downs: IOverallResult[] = []
  ups: IOverallResult[] = []
  startTimeMs: number = 0
  endTimeMs: number = 0

  private conversion = new ConversionService()

  constructor(options?: Partial<ITestPhaseState>) {
    if (options) {
      Object.assign(this, options)
    }
  }

  setRTRChartFromOverallSpeed(overallResults: IOverallResult[]) {
    this.chart = overallResults.reduce((acc, r, i) => {
      const msec = r.nsec / 1e6
      return [
        ...acc,
        {
          x: msec / 1e3,
          y: this.conversion.speedLog(r.speed / 1e6),
        },
      ]
    }, [] as { x: number; y: number }[])
  }

  setChartFromPings(pings: IPing[]): void {
    const oTime = dayjs().startOf("day")
    this.chart = pings.map((p, i) => ({
      x: oTime
        .add(p.time_ns / 1e6, "milliseconds")
        .toDate()
        .getTime(),
      y: p.value_server / 1e6,
    }))
  }

  extendRTRSpeedChart() {
    if (this.counter < 0) {
      return
    }
    this.chart = [
      ...(this.chart || []),
      {
        x: Math.max(this.duration - STATE_UPDATE_TIMEOUT / 1000, 0),
        y: this.conversion.speedLog(this.counter),
      },
    ]
  }
}
