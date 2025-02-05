import { Injectable } from "@angular/core"
import { LoopStoreService } from "../store/loop-store.service"
import { v4 } from "uuid"
import { interval, Subscription, tap } from "rxjs"

export type CertifiedLoopOpts = {
  intervalMinutes: number
  isCertifiedMeasurement: boolean
}

@Injectable({
  providedIn: "root",
})
export class LoopService {
  loopSub?: Subscription

  constructor(private readonly loopStore: LoopStoreService) {}

  scheduleLoop(options?: CertifiedLoopOpts) {
    this.enableLoopMode(options)
    this.loopSub?.unsubscribe()
    this.loopSub = interval(this.loopStore.fullTestIntervalMs()!)
      .pipe(
        tap(() => {
          const newCounter = this.loopStore.loopCounter() + 1
          this.loopStore.loopCounter.set(newCounter)
          if (newCounter >= this.loopStore.maxTestsAllowed()) {
            this.loopStore.maxTestsReached.set(true)
          }
        })
      )
      .subscribe()
  }

  cancelLoop() {
    this.loopSub?.unsubscribe()
    this.disableLoopMode()
  }

  private enableLoopMode(options?: CertifiedLoopOpts) {
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
