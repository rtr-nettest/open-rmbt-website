import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  input,
} from "@angular/core"
import { ISimpleHistorySignal } from "../../../history/interfaces/simple-history-result.interface"
import { I18nStore } from "../../../i18n/store/i18n.store"
import { EChartColor, TestChartDataset } from "../../dto/test-chart-dataset"
import dayjs from "dayjs"
import { ITestChartPluginOptions } from "../../interfaces/test-chart-plugin.interface"
import { TestSignalChart } from "./settings/signal-chart"
import { TestSignalChartOptions } from "./settings/signal-chart-options"
import { TimeIntervalFillPlugin } from "../../plugins/time-interval-fill"
import { TimeIntervalNamePlugin } from "../../plugins/time-interval-name"

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
      const ltePeriods: ITestChartPluginOptions[] = []
      const networkChanges: ITestChartPluginOptions[] = []
      const minSignal = this.getMinSignal()
      const datasets = this.getDatasets(minSignal, ltePeriods, networkChanges)
      const plugins = this.getPlugins(ltePeriods, networkChanges)
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

  private getX(ms: number) {
    return dayjs().startOf("day").add(ms, "milliseconds").toDate().getTime()
  }

  private getMinSignal() {
    let containsLTE = false
    let minSignal = Math.min(
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
    minSignal = Math.abs(minSignal - (minSignal % 25) - 50)
    return Math.min(minSignal, containsLTE ? 140 : 120)
  }

  private getDatasets(
    minSignal: number,
    ltePeriods: ITestChartPluginOptions[],
    networkChanges: ITestChartPluginOptions[]
  ) {
    const datasets: TestChartDataset[] = []
    let currentNetworkType = ""
    let currentDataset: TestChartDataset | undefined
    for (const signal of this.signal()) {
      if (signal.network_type != currentNetworkType) {
        currentNetworkType = signal.network_type
        currentDataset = new TestChartDataset("signal")
        networkChanges.push({
          id: `network-${signal.time_elapsed}`,
          x: signal.time_elapsed - 20,
          duration: 20,
          color: EChartColor.SIGNAL_BORDER,
          text:
            signal.network_type === "LTE" || signal.network_type === "LTE CA"
              ? "LTE\nRSRP"
              : signal.network_type,
        })
        datasets.push(currentDataset)
        if (signal.network_type === "LTE" || signal.network_type === "LTE CA") {
          ltePeriods.push({
            id: `lte-${signal.time_elapsed}`,
            x: signal.time_elapsed,
            color: EChartColor.SIGNAL,
          })
        } else if (
          currentNetworkType === "LTE" ||
          currentNetworkType === "LTE CA"
        ) {
          ltePeriods[ltePeriods.length - 1].duration =
            signal.time_elapsed - ltePeriods[ltePeriods.length - 1].x
        }
      }
      const y =
        minSignal -
        Math.abs(
          signal.lte_rsrp
            ? signal.lte_rsrp
            : signal.nr_rsrp
            ? signal.nr_rsrp
            : signal.signal_strength
        )
      const x = this.getX(signal.time_elapsed)
      currentDataset!.data.push({
        x,
        y,
      })
    }
    if (this.phaseDurations()?.upStart && this.phaseDurations()?.upDuration) {
      // draw the chart until the end of the upload phase
      const lastX = this.getX(
        this.phaseDurations()!.upStart! + this.phaseDurations()!.upDuration!
      )
      const lastSignal = currentDataset?.data[currentDataset.data.length - 1]
      if (lastSignal && lastSignal.x < lastX) {
        currentDataset?.data.push({
          x: lastX,
          y: lastSignal ? lastSignal.y : 0,
        })
      }
      currentDataset = new TestChartDataset("ping")
      currentDataset.data.push({
        x: lastX,
        y: 0,
      })
      datasets.push(currentDataset)
    }
    return datasets
  }

  private getPlugins(
    ltePeriods: ITestChartPluginOptions[],
    networkChanges: ITestChartPluginOptions[]
  ) {
    const plugins: any[] = []
    if (networkChanges.length) {
      for (const p of networkChanges) {
        plugins.push(
          new TimeIntervalFillPlugin({
            id: p.id,
            color: p.color,
            x: p.x,
            duration: p.duration,
          })
        )
        plugins.push(
          new TimeIntervalNamePlugin({
            id: `text-${p.id}`,
            text: p.text,
            x: p.x,
            y: 12,
          })
        )
      }
    }
    if (ltePeriods.length) {
      for (const p of ltePeriods) {
        plugins.push(
          new TimeIntervalFillPlugin({
            id: p.id,
            color: p.color,
            x: p.x,
            duration: p.duration,
          })
        )
      }
    }
    if (this.phaseDurations()?.downStart) {
      plugins.push(
        new TimeIntervalFillPlugin({
          id: "download",
          color: EChartColor.DOWNLOAD,
          x: this.phaseDurations()!.downStart!,
          duration: this.phaseDurations()!.downDuration,
        })
      )
      plugins.push(
        new TimeIntervalNamePlugin({
          id: "text-download",
          text: this.i18nStore.translate("Download"),
          x: this.phaseDurations()!.downStart!,
          y: 84,
        })
      )
    }
    if (this.phaseDurations()?.upStart) {
      plugins.push(
        new TimeIntervalFillPlugin({
          id: "upload",
          color: EChartColor.UPLOAD,
          x: this.phaseDurations()!.upStart!,
          duration: this.phaseDurations()!.upDuration,
        })
      )
      plugins.push(
        new TimeIntervalNamePlugin({
          id: "text-upload",
          text: this.i18nStore.translate("Upload"),
          x: this.phaseDurations()!.upStart!,
          y: 84,
        })
      )
    }
    if (this.phaseDurations()?.pingStart) {
      plugins.push(
        new TimeIntervalFillPlugin({
          id: "ping",
          color: EChartColor.PING,
          x: this.phaseDurations()!.pingStart!,
          duration: this.phaseDurations()!.pingDuration,
        })
      )
      plugins.push(
        new TimeIntervalNamePlugin({
          id: "text-ping",
          text: this.i18nStore.translate("Ping"),
          x: this.phaseDurations()!.pingStart!,
          y: 72,
        })
      )
    }
    return plugins
  }
}
