import { Injectable } from "@angular/core"
import { LoopStoreService } from "../store/loop-store.service"
import { Router } from "@angular/router"
import { ERoutes } from "../../shared/constants/routes.enum"
import { I18nStore } from "../../i18n/store/i18n.store"
import { MessageService } from "../../shared/services/message.service"
import { ELoopEventType } from "../constants/loop-event.enum"

@Injectable({
  providedIn: "root",
})
export class LoopService {
  worker?: Worker

  constructor(
    private readonly loopStore: LoopStoreService,
    private readonly messageService: MessageService
  ) {}

  enableLoopMode(intervalMinutes: number, isCertifiedMeasurement: boolean) {
    this.loopStore.enableLoopMode()
    this.loopStore.testIntervalMinutes.set(intervalMinutes)
    this.loopStore.isCertifiedMeasurement.set(isCertifiedMeasurement)
  }

  scheduleLoop() {
    console.log("Scheduling loop test")
    if (typeof Worker !== "undefined") {
      this.worker = new Worker(
        new URL("../web-workers/loop.worker.ts", import.meta.url)
      )
      this.worker.postMessage({
        type: ELoopEventType.SCHEDULE_LOOP,
        payload: {
          intervalMs: this.loopStore.testIntervalMinutes(),
        },
      })
      this.worker.onmessage = (message) => {
        const type = message.data as ELoopEventType
        switch (type) {
          case ELoopEventType.LOOP_SCHEDULED:
            this.messageService.openSnackbar("Loop test scheduled.")
            break
          case ELoopEventType.LOOP_CANCELLED:
            this.messageService.openSnackbar("Loop test cancelled.")
            this.loopStore.disableLoopMode()
            break
          case ELoopEventType.TRIGGER_NEXT_TEST:
            this.loopStore.loopCounter.set(this.loopStore.loopCounter() + 1)
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
}
