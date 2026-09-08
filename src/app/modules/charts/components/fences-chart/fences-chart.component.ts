import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  input,
} from "@angular/core"
import dayjs from "dayjs"
import { I18nStore } from "../../../i18n/store/i18n.store"
import {
  getMobileNetworkColor,
  getMobileNetworkTechnology,
} from "../../../history/constants/network-technology"
import { IFenceItem } from "../../../history/interfaces/open-test-response"
import { TestChartDataset } from "../../dto/test-chart-dataset"
import { FenceLinePlugin } from "../../plugins/fence-line"
import { TimeIntervalNamePlugin } from "../../plugins/time-interval-name"
import { TestSignalChart } from "../signal-chart/settings/signal-chart"
import { TestSignalChartOptions } from "../signal-chart/settings/signal-chart-options"

@Component({
  selector: "app-fences-chart",
  standalone: true,
  imports: [],
  templateUrl: "./fences-chart.component.html",
  styleUrl: "./fences-chart.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FencesChartComponent implements AfterViewInit {
  id = "fences_chart"
  fences = input<IFenceItem[]>([])
  chart!: TestSignalChart

  get canvas() {
    return document.getElementById(this.id) as HTMLCanvasElement
  }

  constructor(private readonly i18nStore: I18nStore) {}

  ngAfterViewInit(): void {
    const ctx = this.canvas?.getContext("2d")
    if (ctx) {
      const minSignal = this.getMinSignal()
      const datasets = this.getDatasets(minSignal)
      const options = new TestSignalChartOptions(this.i18nStore, minSignal)
      const plugins = this.getPlugins()
      this.chart = new TestSignalChart(
        ctx,
        this.i18nStore,
        datasets,
        options,
        plugins,
      )
    }
  }

  private getX(ms: number) {
    return dayjs().startOf("day").add(ms, "milliseconds").toDate().getTime()
  }

  private getMinSignal() {
    const signals = this.fences().map((fence) => fence.signal ?? 120)

    let minSignal = Math.min(...signals)
    minSignal = Math.abs(minSignal - (minSignal % 25) - 50)
    return Math.min(minSignal, 120)
  }

  private getDatasets(minSignal: number) {
    const dataset = new TestChartDataset("signal")

    for (const fence of this.fences()) {
      if (fence.offset_ms === undefined) {
        continue
      }
      dataset.data.push({
        x: this.getX(fence.offset_ms),
        y: minSignal - Math.abs(fence.signal ?? 120),
      })
    }

    return [dataset]
  }

  private getPlugins() {
    const plugins: any[] = []
    let currentTechnologyId: number | undefined

    for (const fence of this.fences()) {
      if (fence.offset_ms === undefined) {
        continue
      }
      plugins.push(
        new FenceLinePlugin({
          id: `fence-${fence.fence_id}`,
          x: fence.offset_ms,
          color: getMobileNetworkColor(fence.technology_id),
        }),
      )
      if (fence.technology_id !== currentTechnologyId) {
        currentTechnologyId = fence.technology_id
        plugins.push(
          new TimeIntervalNamePlugin({
            id: `fence-tech-${fence.fence_id}`,
            text: this.getTechnologyLabel(fence),
            x: fence.offset_ms,
            y: 12,
          }),
        )
      }
    }

    return plugins
  }

  private getTechnologyLabel(fence: IFenceItem) {
    if (fence.technology?.toUpperCase() === "OFFLINE") {
      return "OFFLINE"
    }
    return getMobileNetworkTechnology(fence.technology_id)
  }
}
