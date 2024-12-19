import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  input,
} from "@angular/core"
import { ISimpleHistorySignal } from "../../interfaces/simple-history-result.interface"
import { TestSignalChart } from "../../dto/test-signal-chart.dto"
import { I18nStore } from "../../../i18n/store/i18n.store"
import {
  EChartBgColor,
  TestChartDataset,
} from "../../dto/test-chart-dataset.dto"
import dayjs from "dayjs"
import { TestSignalChartOptions } from "../../dto/test-signal-chart-options.dto"
import {
  TestChartBgPlugin,
  TestChartBgPluginOptions,
} from "../../dto/test-chart-bg-plugin.dto"

export type PhaseDurations = {
  downStart?: number
  downDuration?: number
  upStart?: number
  upDuration?: number
  pingStart?: number
  pingDuration?: number
}

@Component({
  selector: "app-signal-chart",
  standalone: true,
  imports: [],
  templateUrl: "./signal-chart.component.html",
  styleUrl: "./signal-chart.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignalChartComponent implements AfterViewInit {
  id = "signal_chart"
  signal = input<ISimpleHistorySignal[]>([])
  phaseDurations = input<PhaseDurations | null>(null)
  chart!: TestSignalChart

  get canvas() {
    return document.getElementById(this.id) as HTMLCanvasElement
  }

  constructor(private readonly i18nStore: I18nStore) {}

  ngAfterViewInit(): void {
    const ctx = this.canvas?.getContext("2d")
    if (ctx) {
      const ltePeriods: TestChartBgPluginOptions[] = []
      const minSignal = this.getMinSignal()
      const datasets = this.getDatasets(minSignal, ltePeriods)
      const plugins = this.getPlugins(ltePeriods)
      const options = new TestSignalChartOptions(this.i18nStore, minSignal)
      this.chart = new TestSignalChart(
        ctx,
        this.i18nStore,
        datasets,
        options,
        plugins
      )
    }
  }

  private getMinSignal() {
    let containsLTE = false
    const minSignal = Math.min(
      ...this.signal().map((signal) => {
        if (signal.network_type === "LTE" || signal.network_type === "LTE CA") {
          containsLTE = true
        }
        return signal.lte_rsrp
          ? signal.lte_rsrp
          : signal.nr_rsrp
          ? signal.nr_rsrp
          : signal.signal_strength
      })
    )
    return Math.abs(Math.min(minSignal, containsLTE ? -140 : -120))
  }

  private getDatasets(
    minSignal: number,
    ltePeriods: TestChartBgPluginOptions[]
  ) {
    const datasets: TestChartDataset[] = []
    let currentNetworkType = ""
    let currentDataset: TestChartDataset
    for (const signal of this.signal()) {
      if (signal.network_type != currentNetworkType) {
        currentNetworkType = signal.network_type
        currentDataset = new TestChartDataset("signal")
        datasets.push(currentDataset)
        if (signal.network_type === "LTE" || signal.network_type === "LTE CA") {
          ltePeriods.push({
            id: `lte-${signal.time_elapsed}`,
            start: signal.time_elapsed,
            color: EChartBgColor.SIGNAL,
          })
        } else if (
          currentNetworkType === "LTE" ||
          currentNetworkType === "LTE CA"
        ) {
          ltePeriods[ltePeriods.length - 1].duration =
            signal.time_elapsed - ltePeriods[ltePeriods.length - 1].start
        }
      }
      currentDataset!.data.push({
        x: dayjs()
          .startOf("day")
          .add(signal.time_elapsed, "milliseconds")
          .toDate()
          .getTime(),
        y:
          minSignal -
          Math.abs(
            signal.lte_rsrp
              ? signal.lte_rsrp
              : signal.nr_rsrp
              ? signal.nr_rsrp
              : signal.signal_strength
          ),
      })
    }
    return datasets
  }

  private getPlugins(ltePeriods: TestChartBgPluginOptions[]) {
    const plugins: TestChartBgPlugin[] = []
    if (ltePeriods.length) {
      for (const p of ltePeriods) {
        plugins.push(
          new TestChartBgPlugin({
            id: p.id,
            color: p.color,
            start: p.start,
            duration: p.duration,
          })
        )
      }
    }
    if (this.phaseDurations()?.downStart) {
      plugins.push(
        new TestChartBgPlugin({
          id: "download",
          color: EChartBgColor.DOWNLOAD,
          start: this.phaseDurations()!.downStart!,
          duration: this.phaseDurations()!.downDuration,
        })
      )
    }
    if (this.phaseDurations()?.upStart) {
      plugins.push(
        new TestChartBgPlugin({
          id: "upload",
          color: EChartBgColor.UPLOAD,
          start: this.phaseDurations()!.upStart!,
          duration: this.phaseDurations()!.upDuration,
        })
      )
    }
    if (this.phaseDurations()?.pingStart) {
      plugins.push(
        new TestChartBgPlugin({
          id: "ping",
          color: EChartBgColor.PING,
          start: this.phaseDurations()!.pingStart!,
          duration: this.phaseDurations()!.pingDuration,
        })
      )
    }
    return plugins
  }
}
