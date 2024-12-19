import {
  Component,
  Input,
  NgZone,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
} from "@angular/core"
import { Observable } from "rxjs"
import { ITestVisualizationState } from "../../interfaces/test-visualization-state.interface"
import { withLatestFrom, map } from "rxjs/operators"
import { EMeasurementStatus } from "../../constants/measurement-status.enum"
import { TestPhaseState } from "../../dto/test-phase-state.dto"
import { I18nStore } from "../../../i18n/store/i18n.store"
import { TestStore } from "../../store/test.store"
import { ChartPhase } from "../../dto/test-chart-dataset.dto"
import { TestChart } from "../../dto/test-chart.dto"
import { TestBarChart } from "../../dto/test-bar-chart.dto"
import { TestLogChart } from "../../dto/test-log-chart.dto"
import { AsyncPipe, NgIf } from "@angular/common"
import { TestService } from "../../services/test.service"

@Component({
  selector: "app-test-chart",
  templateUrl: "./test-chart.component.html",
  styleUrls: ["./test-chart.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [NgIf, AsyncPipe],
})
export class TestChartComponent {
  @Input() phase: ChartPhase = "download"

  chart: TestChart | undefined
  visualization$!: Observable<ITestVisualizationState>

  get canvas() {
    return document.getElementById(this.id) as HTMLCanvasElement
  }

  get id() {
    return `${this.phase}_chart`
  }

  private get blankCanvas() {
    return document.getElementById(this.id + "_blank") as HTMLCanvasElement
  }

  private get isCanvasEmpty() {
    return this.canvas?.toDataURL() === this.blankCanvas?.toDataURL()
  }

  constructor(
    private i18nStore: I18nStore,
    private ngZone: NgZone,
    private store: TestStore
  ) {
    this.visualization$ = this.store.visualization$.pipe(
      map((s) => {
        if (this.canvas) {
          this.handleChanges(s)
        }
        return s
      })
    )
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
            this.chart?.resetData()
            break
          case EMeasurementStatus.DOWN:
            this.updateDownload(visualization)
            break
          case EMeasurementStatus.UP:
            this.updateUpload(visualization)
            break
          case EMeasurementStatus.SHOWING_RESULTS:
            this.initChart({ force: true })
            this.showResults(visualization)
            break
          case EMeasurementStatus.END:
            this.showResults(visualization)
            break
        }
      } catch (_) {}
    })
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

  private initChart(options?: { force: boolean }) {
    const ctx = this.canvas?.getContext("2d")
    if (ctx && (options?.force || this.isCanvasEmpty)) {
      try {
        if (this.phase === "ping") {
          this.chart = new TestBarChart(ctx!, this.i18nStore, this.phase)
        } else {
          this.chart = new TestLogChart(ctx!, this.i18nStore, this.phase)
        }
      } catch (e) {
        console.warn(this.phase, e)
      }
    }
  }
}
