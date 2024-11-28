import { IMeasurementPhaseState } from "./measurement-phase-state.interface"
import { ETestStatuses } from "../constants/test-statuses.enum"
import { IOverallResult } from "./overall-result.interface"
import { IPing } from "./measurement-result.interface"

export interface ITestPhaseState extends IMeasurementPhaseState {
  chart?: { x: number; y: number }[]
  counter: number
  container?: ETestStatuses
  label?: string

  setRTRChartFromOverallSpeed?(overallResults: IOverallResult[]): void
  setChartFromPings?(pings: IPing[]): void
  extendRTRSpeedChart(): void
}
