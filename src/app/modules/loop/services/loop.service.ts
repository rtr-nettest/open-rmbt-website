import { Injectable } from "@angular/core"
import { LoopStoreService } from "../store/loop-store.service"
import { interval, Subscription, tap } from "rxjs"

export type CertifiedLoopOpts = {
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
    const { isCertifiedMeasurement } = options || {}
    this.loopStore.isCertifiedMeasurement.set(isCertifiedMeasurement || false)
    this.loopStore.isLoopModeEnabled.set(true)
    this.loopStore.loopCounter.set(1)
    this.loopStore.loopUuid.set(null)
    this.loopStore.maxTestsReached.set(false)
  }

  private disableLoopMode() {
    this.loopStore.loopCounter.set(-1)
    this.loopStore.isLoopModeEnabled.set(false)
  }
}
