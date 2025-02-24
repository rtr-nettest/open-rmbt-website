import {
  AfterViewInit,
  Component,
  computed,
  effect,
  input,
  signal,
} from "@angular/core"
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner"
import { IIntradayResponseItem } from "../../interfaces/intraday-response.interface"
import { Intraday } from "./settings/intraday"
import { I18nStore } from "../../../i18n/store/i18n.store"
import { IntradayOptions } from "./settings/intraday-options"
import { ChartPhase, EChartColor } from "../../../charts/dto/test-chart-dataset"
import { IntradayPingFormatterService } from "../../services/intraday-ping-formatter.service"
import { IntradaySpeedFormatterService } from "../../services/intraday-speed-formatter.service"
import { IntradayDataset } from "./settings/intraday-dataset"
import { Point } from "chart.js"

@Component({
  selector: "app-intraday",
  imports: [MatProgressSpinnerModule],
  templateUrl: "./intraday.component.html",
  styleUrl: "./intraday.component.scss",
})
export class IntradayComponent implements AfterViewInit {
  chart!: Intraday
  id = computed(() => `${this.phase()}_intraday`)
  phase = input.required<ChartPhase>()
  loading = input<boolean>(true)
  data = input<IIntradayResponseItem[]>([])
  legend = [
    {
      color: EChartColor.DOWNLOAD_BORDER,
      text: "Down",
    },
    {
      color: EChartColor.UPLOAD_BORDER,
      text: "Up",
    },
  ]

  get canvas() {
    return document.getElementById(this.id()) as HTMLCanvasElement
  }

  constructor(private readonly i18nStore: I18nStore) {
    effect(() => {
      if (this.data().length) this.initChart()
    })
  }

  ngAfterViewInit(): void {
    this.initChart()
  }

  private initChart() {
    this.chart?.destroy()
    const ctx = this.canvas?.getContext("2d")
    if (ctx) {
      const datasets = this.getDatasets()
      const labels = this.data().map((item) => item.hour.toString())
      const options = this.getOptions(labels)
      this.chart = new Intraday(ctx, this.i18nStore, datasets, labels, options)
    }
  }

  private getOptions(labels: string[]): IntradayOptions {
    return new IntradayOptions(
      this.i18nStore,
      this.phase() === "ping"
        ? new IntradayPingFormatterService(this.i18nStore, labels)
        : new IntradaySpeedFormatterService(this.i18nStore, labels)
    )
  }

  private getDatasets(): any {
    const datasets: IntradayDataset[] = []
    const data = this.data()

    if (this.phase() === "ping") {
      const pingDataset = new IntradayDataset(this.phase(), "line", "x1", "y")
      pingDataset.data = data.reduce((acc, item) => {
        return [
          ...acc,
          { x: item.hour, y: item.quantile_ping },
          { x: item.hour + 1, y: item.quantile_ping },
        ]
      }, [] as Point[])
      datasets.push(pingDataset)
    } else {
      // Download
      const downDataset = new IntradayDataset("download", "line", "x1", "y")
      downDataset.data = data.reduce((acc, item) => {
        return [
          ...acc,
          { x: item.hour, y: item.quantile_down },
          { x: item.hour + 1, y: item.quantile_down },
        ]
      }, [] as Point[])
      datasets.push(downDataset)

      // Upload
      const upDataset = new IntradayDataset("upload", "line", "x1", "y")
      upDataset.data = data.reduce((acc, item) => {
        return [
          ...acc,
          { x: item.hour, y: item.quantile_up },
          { x: item.hour + 1, y: item.quantile_up },
        ]
      }, [] as Point[])
      datasets.push(upDataset)
    }

    // Count
    const countDataset = new IntradayDataset("signal", "bar", "x", "y1")
    countDataset.data = data.map((item) => {
      return {
        x: item.hour,
        y: item.count,
      }
    })
    datasets.push(countDataset)

    return datasets
  }
}
