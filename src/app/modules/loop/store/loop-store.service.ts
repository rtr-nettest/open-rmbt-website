import { computed, Injectable, signal } from "@angular/core"

@Injectable({
  providedIn: "root",
})
export class LoopStoreService {
  loopUuid = signal<string | null>(null)
  loopCounter = signal<number>(-1)
  enableLoopMode = signal<boolean>(false)
  testIntervalMinutes = signal<number | null>(null)
  fullTestIntervalMs = computed(() =>
    this.testIntervalMinutes() ? this.testIntervalMinutes()! * 60 * 1000 : null
  )
  isCertifiedMeasurement = signal<boolean>(false)
  maxTestsReached = signal<boolean>(false)
}
