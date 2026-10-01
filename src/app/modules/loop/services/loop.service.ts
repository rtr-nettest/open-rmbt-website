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
  private worker?: Worker
  private isLoopPaused = false

  constructor(private readonly loopStore: LoopStoreService) {}

  scheduleLoop(options: LoopOpts) {
    if (this.loopStore.isLoopModeEnabled()) {
      return
    }
    const { isCertifiedMeasurement, maxTestsAllowed, testIntervalMinutes } =
      options
    this.loopStore.isCertifiedMeasurement.set(isCertifiedMeasurement)
    this.loopStore.isLoopModeEnabled.set(true)
    this.loopStore.loopCounter.set(1)
    this.loopStore.loopUuid.set(null)
    this.loopStore.maxTestsAllowed.set(maxTestsAllowed)
    this.loopStore.maxTestsReached.set(false)
    this.loopStore.testIntervalMinutes.set(testIntervalMinutes)
    this.worker = new Worker(new URL("./loop-timer.worker", import.meta.url))
    this.worker.addEventListener("message", ({ data }) => {
      switch (data.type) {
        case "timer":
          const newCounter = this.loopStore.loopCounter() + 1
          this.loopStore.loopCounter.set(newCounter)
          break
      }
    })
    this.worker.postMessage({
      type: "startTimer",
      interval: testIntervalMinutes * 60,
    })
    this.isLoopPaused = false
  }

  // The main thread reports when each test actually starts/finishes so the
  // timer worker can schedule the next test relative to the real finish time
  // (finish + 5s / start + interval), instead of firing on a free-running
  // interval that overlaps slow tests.
  notifyTestStarted() {
    this.worker?.postMessage({ type: "testStarted" })
  }

  notifyTestFinished() {
    this.worker?.postMessage({ type: "testFinished" })
  }

  pauseLoop() {
    if (this.isLoopPaused) return
    this.isLoopPaused = true
    this.worker?.postMessage({ type: "pauseTimer" })
  }

  resumeLoop() {
    if (!this.isLoopPaused) return
    this.isLoopPaused = false
    this.worker?.postMessage({ type: "resumeTimer" })
  }

  cancelLoop() {
    this.worker?.terminate()
    this.worker = undefined
    this.loopStore.loopCounter.set(-1)
    this.loopStore.isLoopModeEnabled.set(false)
    this.loopStore.isCertifiedMeasurement.set(false)
  }
}
