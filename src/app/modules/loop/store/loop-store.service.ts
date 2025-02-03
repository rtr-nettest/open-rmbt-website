import { computed, Injectable, signal } from "@angular/core"
import { v4 } from "uuid"
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
  estimatedEndTime = signal<number | null>(null)
  isCertifiedMeasurement = signal<boolean>(false)
  maxTestsAllowed = signal<number>(environment.certifiedTests.count)
  maxTestsReached = signal<boolean>(false)

  enableLoopMode() {
    this.loopUuid.set(v4())
    this.loopCounter.set(1)
    this.isLoopModeEnabled.set(true)
  }

  disableLoopMode() {
    this.loopCounter.set(1)
    this.isLoopModeEnabled.set(false)
    this.isCertifiedMeasurement.set(false)
    this.maxTestsReached.set(false)
  }
}
