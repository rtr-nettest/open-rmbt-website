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

  chart: TestChart | undefined
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
  updateTimer?: NodeJS.Timeout

  get canvas() {
    return document.getElementById(this.id()) as HTMLCanvasElement
  }

  constructor(
    private i18nStore: I18nStore,
    private ngZone: NgZone,
    private store: TestStore
  ) {
    this.visualization$ = this.store.visualization$.pipe(
      distinctUntilKeyChanged("currentPhaseName"),
      map((s) => {
        if (this.canvas) {
          this.handleChanges(s)
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

  private handleChanges(visualization: ITestVisualizationState) {
    this.ngZone.runOutsideAngular(async () => {
      this.initChart()
      try {
        switch (visualization.currentPhaseName) {
          case EMeasurementStatus.INIT:
          case EMeasurementStatus.INIT_DOWN:
          case EMeasurementStatus.PING:
          case EMeasurementStatus.NOT_STARTED:
            this.resetData()
            break
          case EMeasurementStatus.DOWN:
            this.updateDownload(visualization)
            break
          case EMeasurementStatus.UP:
            this.updateUpload(visualization)
            break
          case EMeasurementStatus.SHOWING_RESULTS:
          case EMeasurementStatus.END:
            this.showResults(visualization)
            break
        }
      } catch (_) {}
    })
  }

  private resetData() {
    if (this.chart?.data.datasets[0].data.length) {
      this.chart?.resetData()
    }
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
    if (!this.chart) {
      return
    }
    if (this.phase === "download") {
      this.chart.updateData(visualization.phases[EMeasurementStatus.DOWN])
    } else if (this.phase === "ping" && !this.chart.finished) {
      this.chart.setData(visualization.phases[EMeasurementStatus.PING])
    } else if (this.phase === "upload") {
      this.resetData()
    }
  }

  private updateUpload(visualization: ITestVisualizationState) {
    if (!this.chart) {
      return
    }
    if (this.phase === "upload") {
      this.chart.updateData(visualization.phases[EMeasurementStatus.UP])
    } else if (this.phase === "download" && !this.chart.finished) {
      this.chart.setData(visualization.phases[EMeasurementStatus.DOWN])
    } else if (this.phase === "ping" && !this.chart.finished) {
      this.chart.setData(visualization.phases[EMeasurementStatus.PING])
    }
  }

  private initChart() {
    const ctx = this.canvas?.getContext("2d")
    if (ctx && !this.updateTimer) {
      try {
        if (this.phase === "ping") {
          this.chart = new BarChart(ctx!, this.i18nStore, this.phase)
        } else {
          this.chart = new LogChart(ctx!, this.i18nStore, this.phase)
        }
      } catch (e) {
        console.warn(this.phase, e)
      }
    }
  }
}
