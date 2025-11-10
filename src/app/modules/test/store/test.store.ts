import { effect, Injectable, signal } from "@angular/core"
import { BehaviorSubject } from "rxjs"
import { IBasicNetworkInfo } from "../interfaces/basic-network-info.interface"
import { ITestVisualizationState } from "../interfaces/test-visualization-state.interface"
import { TestVisualizationState } from "../dto/test-visualization-state.dto"
import { BasicNetworkInfo } from "../dto/basic-network-info.dto"
import { LOCATION_PERMISSION_DENIED } from "../constants/strings"

@Injectable({
  providedIn: "root",
})
export class TestStore {
  basicNetworkInfo = signal<IBasicNetworkInfo>(new BasicNetworkInfo())
  visualization$ = new BehaviorSubject<ITestVisualizationState>(
    new TestVisualizationState()
  )
  shouldAbort = signal<boolean>(false)
  isRunning = signal<boolean>(false)
  locationPermissionDenied = signal<boolean>(false)

  constructor() {
    if (globalThis.sessionStorage) {
      const locationPermissionDenied = sessionStorage.getItem(
        LOCATION_PERMISSION_DENIED
      )
      this.locationPermissionDenied.set(locationPermissionDenied === "true")
      effect(() => {
        sessionStorage.setItem(
          LOCATION_PERMISSION_DENIED,
          this.locationPermissionDenied().toString()
        )
      })
    }
  }
}
