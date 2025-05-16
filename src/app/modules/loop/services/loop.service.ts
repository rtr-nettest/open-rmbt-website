import { Injectable } from "@angular/core"
import { LoopStoreService } from "../store/loop-store.service"
import { interval, Subscription, tap } from "rxjs"

export type LoopOpts = {
  isCertifiedMeasurement: boolean
  maxTestsAllowed: number
  testIntervalMinutes: number
}

@Injectable({
  providedIn: "root",
})
export class LoopService {
  loopSub?: Subscription

  constructor(private readonly loopStore: LoopStoreService) {}

  scheduleLoop(options: LoopOpts) {
    const { isCertifiedMeasurement, maxTestsAllowed, testIntervalMinutes } =
      options
    this.loopStore.isCertifiedMeasurement.set(isCertifiedMeasurement)
    this.loopStore.isLoopModeEnabled.set(true)
    this.loopStore.loopCounter.set(1)
    this.loopStore.loopUuid.set(null)
    this.loopStore.maxTestsAllowed.set(maxTestsAllowed)
    this.loopStore.maxTestsReached.set(false)
    this.loopStore.testIntervalMinutes.set(testIntervalMinutes)
    this.loopSub?.unsubscribe()
    this.loopSub = interval(this.loopStore.fullTestIntervalMs()!)
      .pipe(
        tap(() => {
          const newCounter = this.loopStore.loopCounter() + 1
          this.loopStore.loopCounter.set(newCounter)
        })
      )
      .subscribe()
  }

  cancelLoop() {
    this.loopSub?.unsubscribe()
    this.loopStore.loopCounter.set(-1)
    this.loopStore.isLoopModeEnabled.set(false)
  }
}
