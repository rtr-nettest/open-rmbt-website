import { Injectable } from "@angular/core"
import { LoopStoreService } from "../store/loop-store.service"
import { v4 } from "uuid"
import { MessageService } from "../../shared/services/message.service"
import { ELoopEventType } from "../constants/loop-event.enum"

export type CertifiedLoopOpts = {
  intervalMinutes: number
  isCertifiedMeasurement: boolean
}

@Injectable({
  providedIn: "root",
})
export class LoopService {
  worker?: Worker

  constructor(
    private readonly loopStore: LoopStoreService,
    private readonly messageService: MessageService
  ) {}

  scheduleLoop(options?: CertifiedLoopOpts) {
    this.enableLoopMode(options)
    if (typeof Worker !== "undefined") {
      this.worker = new Worker(
        new URL("../web-workers/loop.worker.ts", import.meta.url)
      )
      this.worker.postMessage({
        type: ELoopEventType.SCHEDULE_LOOP,
        payload: {
          intervalMs: this.loopStore.fullTestIntervalMs(),
        },
      })
      this.worker.onmessage = (message) => {
        const type = message.data as ELoopEventType
        switch (type) {
          case ELoopEventType.LOOP_CANCELLED:
            this.messageService.openSnackbar("Loop test cancelled.")
            this.disableLoopMode()
            this.worker?.terminate()
            break
          case ELoopEventType.TRIGGER_NEXT_TEST:
            const newCounter = this.loopStore.loopCounter() + 1
            this.loopStore.loopCounter.set(newCounter)
            if (newCounter >= this.loopStore.maxTestsAllowed()) {
              this.loopStore.maxTestsReached.set(true)
            }
            break
        }
      }
    } else {
      this.messageService.openSnackbar(
        "Web Workers are not supported in this browser"
      )
    }
  }

  cancelLoop() {
    this.worker?.postMessage({
      type: ELoopEventType.CANCEL_LOOP,
    })
  }

  private enableLoopMode(options?: CertifiedLoopOpts | undefined) {
    const { isCertifiedMeasurement, intervalMinutes } = options || {}
    this.loopStore.isCertifiedMeasurement.set(isCertifiedMeasurement || false)
    this.loopStore.isLoopModeEnabled.set(true)
    this.loopStore.loopCounter.set(1)
    this.loopStore.loopUuid.set(v4())
    this.loopStore.testIntervalMinutes.set(intervalMinutes || null)
  }

  private disableLoopMode() {
    this.loopStore.isCertifiedMeasurement.set(false)
    this.loopStore.isLoopModeEnabled.set(false)
    this.loopStore.loopCounter.set(1)
    this.loopStore.maxTestsReached.set(false)
    this.loopStore.testIntervalMinutes.set(null)
  }
}
