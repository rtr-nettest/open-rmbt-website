/// <reference lib="webworker" />

import { ELoopEventType } from "../constants/loop-event.enum"
import { ILoopEvent } from "../interfaces/loop-event.interface"

let loopInterval: NodeJS.Timeout | undefined

addEventListener("message", (message) => {
  const { type, payload } = (message as any).data as ILoopEvent
  switch (type) {
    case ELoopEventType.SCHEDULE_LOOP:
      loopInterval = setInterval(() => {
        postMessage(ELoopEventType.TRIGGER_NEXT_TEST)
      }, payload?.intervalMs)
      postMessage(ELoopEventType.LOOP_SCHEDULED)
      break
    case ELoopEventType.CANCEL_LOOP:
      clearInterval(loopInterval)
      postMessage(ELoopEventType.LOOP_CANCELLED)
      break
  }
})
