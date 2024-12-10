import { EMeasurementStatus } from "../constants/measurement-status.enum"
import { ITestPhaseState } from "./test-phase-state.interface"

export interface ITestVisualizationState {
  phases: {
    [key: string]: ITestPhaseState
  }
  currentPhaseName: EMeasurementStatus
  startTimeMs: number
  endTimeMs: number

  setCounter(
    newPhase: EMeasurementStatus,
    newTestPhaseState: ITestPhaseState
  ): void

  setDone(newPhase: EMeasurementStatus): void

  extendChart(newPhase: EMeasurementStatus): void
}
