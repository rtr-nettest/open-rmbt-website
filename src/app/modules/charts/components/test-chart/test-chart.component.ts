import {
  Component,
  Input,
  NgZone,
  ChangeDetectionStrategy,
  OnDestroy,
  computed,
} from "@angular/core"
import { fromEvent, Observable, Subject } from "rxjs"
import { ITestVisualizationState } from "../../../test/interfaces/test-visualization-state.interface"
import {
  debounceTime,
  distinctUntilKeyChanged,
  map,
  takeUntil,
} from "rxjs/operators"
import { EMeasurementStatus } from "../../../test/constants/measurement-status.enum"
import { I18nStore } from "../../../i18n/store/i18n.store"
import { TestStore } from "../../../test/store/test.store"
import { ChartPhase } from "../../dto/test-chart-dataset"
import { TestChart } from "../../dto/test-chart"
import { AsyncPipe, NgIf } from "@angular/common"
import { BarChart } from "./settings/bar-chart"
import { LogChart } from "./settings/log-chart"
import { STATE_UPDATE_TIMEOUT } from "../../../test/constants/numbers"

@Component({
  selector: "app-test-chart",
  templateUrl: "./test-chart.component.html",
  styleUrls: ["./test-chart.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIf, AsyncPipe],
})
export class TestChartComponent implements OnDestroy {
  @Input() phase: ChartPhase = "download"

  destroyed$ = new Subject<void>()
  visualization$!: Observable<ITestVisualizationState>
  resizeSub = fromEvent(window, "resize")
    .pipe(takeUntil(this.destroyed$), debounceTime(100))
    .subscribe(() => {
      const el = document.getElementById(this.id())
      if (el) {
        el.style.width = `100%`
      }
    })
  id = computed(() => `${this.phase}_chart`)
  worker?: Worker
  updateTimer?: NodeJS.Timeout
  offscreenCanvas?: OffscreenCanvas

  get canvas() {
    return document.getElementById(this.id()) as HTMLCanvasElement
  }

  private get blankCanvas() {
    return document.getElementById(this.id() + "_blank") as HTMLCanvasElement
  }

  private get isCanvasEmpty() {
    return this.canvas?.toDataURL() === this.blankCanvas?.toDataURL()
  }

  constructor(
    private i18nStore: I18nStore,
    private ngZone: NgZone,
    private store: TestStore
  ) {
    this.worker = new Worker(new URL("./test-chart.worker", import.meta.url))
    this.visualization$ = this.store.visualization$.pipe(
      distinctUntilKeyChanged("currentPhaseName"),
      map((s) => {
        if (this.canvas) {
          if (!this.offscreenCanvas) {
            this.offscreenCanvas = this.canvas.transferControlToOffscreen()
            this.worker?.postMessage(
              {
                type: "init",
                data: {
                  canvas: this.offscreenCanvas,
                  i18nStore: this.i18nStore,
                  phase: this.phase,
                },
              },
              [this.offscreenCanvas]
            )
          }
          this.worker?.postMessage({
            type: "handleChanges",
            data: s,
          })
          if (!this.updateTimer) {
            this.updateTimer = setInterval(() => {
              this.handleChanges(this.store.visualization$.value)
            }, STATE_UPDATE_TIMEOUT * 2)
          }
          if (
            s.currentPhaseName === EMeasurementStatus.SHOWING_RESULTS ||
            s.currentPhaseName === EMeasurementStatus.END
          ) {
            clearInterval(this.updateTimer)
            this.updateTimer = undefined
          }
        }
        return s
      })
    )
  }

  ngOnDestroy(): void {
    clearInterval(this.updateTimer)
    this.updateTimer = undefined
    this.destroyed$.next()
    this.destroyed$.complete()
  }

  private showResults(visualization: ITestVisualizationState) {
    if (!!this.chart?.finished) {
      return
    }
    if (this.phase === "download") {
      this.chart?.setData(visualization.phases[EMeasurementStatus.DOWN])
    } else if (this.phase === "upload") {
      this.chart?.setData(visualization.phases[EMeasurementStatus.UP])
    } else if (this.phase === "ping") {
      this.chart?.setData(visualization.phases[EMeasurementStatus.PING])
    }
  }

  private updateDownload(visualization: ITestVisualizationState) {
    if (this.phase === "download") {
      this.chart?.updateData(visualization.phases[EMeasurementStatus.DOWN])
    } else if (this.phase === "ping" && !this.chart?.finished) {
      this.chart?.setData(visualization.phases[EMeasurementStatus.PING])
    } else if (this.phase === "upload") {
      this.chart?.resetData()
    }
  }

  private updateUpload(visualization: ITestVisualizationState) {
    if (this.phase === "upload") {
      this.chart?.updateData(visualization.phases[EMeasurementStatus.UP])
    } else if (this.phase === "download" && !this.chart?.finished) {
      this.chart?.setData(visualization.phases[EMeasurementStatus.DOWN])
    } else if (this.phase === "ping" && !this.chart?.finished) {
      this.chart?.setData(visualization.phases[EMeasurementStatus.PING])
    }
  }
}
