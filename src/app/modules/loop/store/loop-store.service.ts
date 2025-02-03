import { computed, Injectable, signal } from "@angular/core"
import { environment } from "../../../../environments/environment"

@Injectable({
  providedIn: "root",
})
export class LoopStoreService {
  loopUuid = signal<string | null>(null)
  loopCounter = signal<number>(-1)
  isLoopModeEnabled = signal<boolean>(false)
  testIntervalMinutes = signal<number | null>(null)
  fullTestIntervalMs = computed(() =>
    this.testIntervalMinutes() ? this.testIntervalMinutes()! * 60 * 1000 : null
  )
  estimatedEndTime = computed(() => {
    const singleTestDuration = this.fullTestIntervalMs()
    if (!singleTestDuration) {
      return null
    }
    return Date.now() + singleTestDuration * this.maxTestsAllowed()
  })
  isCertifiedMeasurement = signal<boolean>(false)
  maxTestsAllowed = signal<number>(environment.certifiedTests.count)
  maxTestsReached = signal<boolean>(false)
}
