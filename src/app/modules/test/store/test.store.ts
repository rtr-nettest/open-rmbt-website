import { Injectable, signal } from "@angular/core"
import { BehaviorSubject } from "rxjs"
import { IBasicNetworkInfo } from "../interfaces/basic-network-info.interface"
import { ITestVisualizationState } from "../interfaces/test-visualization-state.interface"
import { TestVisualizationState } from "../dto/test-visualization-state.dto"
import { BasicNetworkInfo } from "../dto/basic-network-info.dto"

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
}
