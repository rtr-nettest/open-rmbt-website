import { IMeasurementPhaseState } from "./measurement-phase-state.interface"
import { ETestStatuses } from "../constants/test-statuses.enum"
import { IOverallResult } from "../../history/interfaces/overall-result.interface"
import { IPing } from "../../history/interfaces/measurement-result.interface"

export interface ITestPhaseState extends IMeasurementPhaseState {
  chart?: { x: number; y: number }[]
  counter: number
  container?: ETestStatuses
  label?: string

  setChartFromOverallSpeed?(overallResults: IOverallResult[]): void
  setChartFromPings?(pings: IPing[]): void
  extendSpeedChart(): void
}
