import { ELoopEventType } from "../constants/loop-event.enum"

export interface ILoopEvent {
  type: ELoopEventType
  payload?: {
    intervalMs?: number
  }
}
