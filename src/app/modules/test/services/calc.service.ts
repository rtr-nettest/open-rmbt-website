import { MeasurementThreadResult } from "../dto/measurement-thread-result.dto"
import {
  IMeasurementThreadResult,
  IPing,
  ISpeedItem,
} from "../interfaces/measurement-result.interface"
import { IOverallResult } from "../interfaces/overall-result.interface"

type CurveItem = {
  bytes_total: number
  time_elapsed: number
  speed?: number
}

export class CalcService {
  private static instance = new CalcService()

  static get I() {
    return this.instance
  }

  private constructor() {}

  getOverallPings(
    pings: {
      ping_ms: number
      time_elapsed: number
    }[]
  ): IPing[] {
    if (!pings?.length) {
      return []
    }
    let startX = 0
    return pings
      .map((p) => ({
        time_ns: p.time_elapsed * 1e6,
        value: p.ping_ms * 1e6,
        value_server: p.ping_ms * 1e6,
      }))
      .filter((p) => p.time_ns > 0)
      .reduce((acc, p, i) => {
        if (i === 0) {
          startX = p.time_ns
        }
        return [...acc, { ...p, time_ns: p.time_ns - startX }]
      }, [] as IPing[])
  }

  getOverallResultsFromSpeedCurve(
    curve: CurveItem[],
    stepMs = 175 // value from RTR web
  ): IOverallResult[] {
    if (!curve?.length) {
      return []
    }
    if (!stepMs) {
      return curve.map(this.parseCurveItem)
    }
    const options = {
      lastBytes: 0,
      lastMs: 0,
      stepMs,
    }
    const resp: IOverallResult[] = [
      {
        bytes: 0,
        nsec: 0,
        speed: 0,
      },
    ]
    for (const ci of curve) {
      const result = this.calcResultForStep(ci, options)
      if (result) {
        resp.push(result)
      }
    }
    return resp
  }

  private calcResultForStep(
    ci: CurveItem,
    options: {
      lastBytes: number
      lastMs: number
      stepMs: number
    }
  ) {
    const { lastBytes, lastMs, stepMs } = options
    let retVal: IOverallResult | null = null
    if (ci.time_elapsed - lastMs >= stepMs) {
      retVal = this.parseCurveItem({
        bytes_total: ci.bytes_total,
        time_elapsed: ci.time_elapsed,
        speed: this.calcSpeed(
          ci.bytes_total - lastBytes,
          ci.time_elapsed - lastMs
        ),
      })
      options.lastBytes = ci.bytes_total
      options.lastMs = ci.time_elapsed
    }
    return retVal
  }

  private calcSpeed(bytes: number, timeMs: number) {
    return Math.max((bytes * 8) / (timeMs / 1e3), 0)
  }

  private parseCurveItem = (ci: CurveItem) => ({
    bytes: ci.bytes_total,
    nsec: ci.time_elapsed * 1e6,
    speed: ci.speed ?? this.calcSpeed(ci.bytes_total, ci.time_elapsed),
  })
}
