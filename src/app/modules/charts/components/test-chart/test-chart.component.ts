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
      this.resizeChart()
    })
  id = computed(() => `${this.phase}_chart`)
  worker?: Worker
  offscreenCanvas?: OffscreenCanvas
  height = computed(() => {
    const parent = this.canvas.parentElement
    return parent!.getBoundingClientRect().height
  })
  width = computed(() => {
    const parent = this.canvas.parentElement
    return parent!.getBoundingClientRect().width
  })

  get canvas() {
    return document.getElementById(this.id()) as HTMLCanvasElement
  }

  constructor(private i18nStore: I18nStore, private store: TestStore) {
    this.worker = new Worker(new URL("./test-chart.worker", import.meta.url))
    this.visualization$ = this.store.visualization$.pipe(
      distinctUntilKeyChanged("currentPhaseName"),
      map((s) => {
        if (this.canvas) {
          if (!this.offscreenCanvas) {
            this.offscreenCanvas = this.canvas.transferControlToOffscreen()
            this.worker!.addEventListener("message", ({ data }) => {
              if (data.type === "tick") {
                this.worker!.postMessage({
                  type: "handleChanges",
                  visualization: this.store.visualization$.value,
                })
              }
            })
            this.worker!.postMessage(
              {
                type: "initChart",
                canvas: this.offscreenCanvas,
                phase: this.phase,
                devicePixelRatio: window.devicePixelRatio,
              },
              [this.offscreenCanvas]
            )
            this.resizeChart()
          }
          this.worker!.postMessage({
            type: "handleChanges",
            visualization: s,
          })
          if (
            s.currentPhaseName === EMeasurementStatus.SHOWING_RESULTS ||
            s.currentPhaseName === EMeasurementStatus.END
          ) {
            this.worker!.postMessage({
              type: "stopUpdates",
            })
          }
        }
        return s
      })
    )
  }

  ngOnDestroy(): void {
    this.worker?.terminate()
    this.destroyed$.next()
    this.destroyed$.complete()
  }

  private resizeChart() {
    this.worker!.postMessage({
      type: "resizeChart",
      width: this.width(),
      height: this.height(),
    })
  }
}
