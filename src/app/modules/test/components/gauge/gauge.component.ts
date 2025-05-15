import { ChangeDetectionStrategy, Component, NgZone } from "@angular/core"
import { distinctUntilChanged, Observable, tap } from "rxjs"
import { TestStore } from "../../store/test.store"
import { I18nStore } from "../../../i18n/store/i18n.store"
import { EMeasurementStatus } from "../../constants/measurement-status.enum"
import { ITestPhaseState } from "../../interfaces/test-phase-state.interface"
import { AsyncPipe, NgIf } from "@angular/common"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { ITestVisualizationState } from "../../interfaces/test-visualization-state.interface"
import { roundToSignificantDigits, speedLog } from "../../../shared/util/math"
import { TestService } from "../../services/test.service"

@Component({
  selector: "app-gauge",
  templateUrl: "./gauge.component.html",
  styleUrls: ["./gauge.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, NgIf, TranslatePipe],
})
export class GaugeComponent {
  visualization$!: Observable<ITestVisualizationState>
  measurementProgress: string = ""

  constructor(
    private i18nStore: I18nStore,
    private store: TestStore,
    private ngZone: NgZone,
    private service: TestService
  ) {
    this.visualization$ = this.store.visualization$.pipe(
      distinctUntilChanged(),
      tap((state) => {
        this.ngZone.runOutsideAngular(() => {
          this.drawLoop(state.phases[state.currentPhaseName])
        })
      })
    )
  }

  private setBarPercentage(barSelector: string, percents: number) {
    var bar = document.querySelector(barSelector) as SVGGeometryElement
    if (bar) {
      bar.style.strokeDasharray = bar.getTotalLength() * percents + ",9999"
    }
  }

  private drawLoop(phaseState: ITestPhaseState) {
    const locale = this.i18nStore.activeLang
    let { phase: status, progress, counter } = phaseState
    let barSelector = null
    let directionSymbol = null
    let speedMbit = -1
    const fullProgress = this.service.getProgressSegment(status, progress)
    const percents = document.querySelector("#percents")
    if (percents) {
      percents.textContent = fullProgress + "\u200a%"
      if (fullProgress % 10 == 0) {
        this.measurementProgress = percents.textContent
      }
    }
    switch (status) {
      case EMeasurementStatus.INIT:
        this.setBarPercentage("#ping", 0)
        this.setBarPercentage("#download", 0)
        this.setBarPercentage("#upload", 0)
        barSelector = "#init"
        progress = progress * 0.1
        break
      case EMeasurementStatus.INIT_DOWN:
        barSelector = "#init"
        progress = progress * 0.9 + 0.1
        break
      case EMeasurementStatus.PING:
        this.setBarPercentage("#init", 1)
        this.setBarPercentage("#download", 0)
        this.setBarPercentage("#upload", 0)
        barSelector = "#ping"
        break
      case EMeasurementStatus.DOWN:
        this.setBarPercentage("#init", 1)
        this.setBarPercentage("#ping", 1)
        this.setBarPercentage("#upload", 0)
        barSelector = "#download"
        //set symbol as unicode, since IE won't handle html entities
        speedMbit = counter
        directionSymbol = "\u21a7" //↧
        break
      case EMeasurementStatus.INIT_UP:
        this.setBarPercentage("#init", 1)
        this.setBarPercentage("#ping", 1)
        this.setBarPercentage("#download", 1)
        barSelector = "#upload"
        progress = Math.min(0.95, progress * 0.1)
        directionSymbol = "\u21a5" //↥
        break
      case EMeasurementStatus.UP:
        this.setBarPercentage("#init", 1)
        this.setBarPercentage("#ping", 1)
        this.setBarPercentage("#download", 1)
        barSelector = "#upload"
        progress = Math.min(0.95, progress * 0.9 + 0.1)
        speedMbit = counter
        directionSymbol = "\u21a5" //↥
        break
      case EMeasurementStatus.SUBMITTING_RESULTS:
      case EMeasurementStatus.END:
        this.setBarPercentage("#init", 1)
        this.setBarPercentage("#ping", 1)
        this.setBarPercentage("#download", 1)
        barSelector = "#upload"
        progress = 1
        break
    }
    if (barSelector !== null) {
      this.setBarPercentage(barSelector, progress)
    }

    const speedTextEl = document.querySelector("#speedtext")
    const speedUnitEl = document.querySelector("#speedunit")
    const speedEl = document.querySelector("#speed")
    if (!speedTextEl || !speedUnitEl || !speedEl) {
      return
    }
    //if speed information is available - set text
    if (speedMbit !== null && speedMbit > 0) {
      this.setBarPercentage("#speed", speedLog(speedMbit))
      speedTextEl.innerHTML =
        '<tspan style="fill:#59b200">' +
        directionSymbol +
        "</tspan>\u200a" +
        roundToSignificantDigits(speedMbit).toLocaleString(
          this.i18nStore.activeLang
        )
      speedUnitEl.textContent = this.i18nStore.translate("Mbps")

      //enable smoothing animations on speed gauge, as soon as initial speed value is set
      //as not to visualize a gradually increase of speed
      setTimeout(function () {
        speedEl.setAttribute("class", "gauge speed active")
      }, 500)
    }
    //if only direction symbol is set - display this (init upload phase)
    else if (directionSymbol !== null) {
      speedEl.setAttribute("class", "gauge speed")
      this.setBarPercentage("#speed", 0)
      speedTextEl.innerHTML =
        '<tspan style="fill:#59b200">' + directionSymbol + "</tspan>"
    }
    //if no speed is available - clear fields, but without any animations
    else {
      speedEl.setAttribute("class", "gauge speed")
      this.setBarPercentage("#speed", 0)
      speedTextEl.textContent = ""
      speedUnitEl.textContent = ""
    }
  }
}
