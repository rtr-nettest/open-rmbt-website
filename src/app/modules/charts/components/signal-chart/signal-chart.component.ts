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
import { EMNT } from "../../../history/constants/network-technology"
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
      const minSignal = this.getMinSignal()
      const datasets = this.getDatasets(minSignal)
      const plugins = this.getPlugins()
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
    const values: number[] = []
    for (const signal of this.signal()) {
      if (signal.lte_rsrp != null) {
        containsLTE = true
        values.push(signal.lte_rsrp)
      }
      if (signal.nr_rsrp != null) {
        values.push(signal.nr_rsrp)
      }
      if (signal.lte_rsrp == null && signal.nr_rsrp == null) {
        values.push(signal.signal_strength)
      }
    }
    let minSignal = Math.min(...values)
    minSignal = Math.abs(minSignal - (minSignal % 25) - 50)
    return Math.min(minSignal, containsLTE ? 140 : 120)
  }

  /**
   * Builds one line per technology present in the test so that 4G (LTE RSRP)
   * and 5G (NR RSRP) are drawn as separate, distinctly coloured lines. During
   * NSA operation a single sample carries both `lte_rsrp` and `nr_rsrp`, so it
   * contributes a point to both lines at the same time.
   */
  private getDatasets(minSignal: number) {
    const datasets: TestChartDataset[] = []
    const seriesByKey = new Map<string, TestChartDataset>()
    const getY = (value: number) => minSignal - Math.abs(value)

    const addPoint = (
      key: string,
      label: string,
      borderColor: string,
      backgroundColor: string,
      x: number,
      value: number
    ) => {
      let dataset = seriesByKey.get(key)
      if (!dataset) {
        dataset = new TestChartDataset("signal")
        dataset.label = label
        dataset.borderColor = borderColor
        dataset.backgroundColor = backgroundColor
        seriesByKey.set(key, dataset)
        datasets.push(dataset)
      }
      dataset.data.push({ x, y: getY(value) })
    }

    // 5G is Non-Standalone when any sample carries both an LTE anchor
    // (lte_rsrp) and an NR reading (nr_rsrp); otherwise it is Standalone.
    const is5gNsa = this.signal().some(
      (signal) => signal.lte_rsrp != null && signal.nr_rsrp != null
    )
    for (const signal of this.signal()) {
      const x = this.getX(signal.time_elapsed)
      if (signal.lte_rsrp != null) {
        addPoint(
          EMNT.T_4G,
          EMNT.T_4G,
          EChartColor.GEN_4G_BORDER,
          EChartColor.GEN_4G,
          x,
          signal.lte_rsrp
        )
      }
      if (signal.nr_rsrp != null) {
        addPoint(
          is5gNsa ? EMNT.T_5G_NSA : EMNT.T_5G_SA,
          is5gNsa ? EMNT.T_5G_NSA : EMNT.T_5G_SA,
          is5gNsa ? EChartColor.GEN_5G_NSA_BORDER : EChartColor.GEN_5G_SA_BORDER,
          is5gNsa ? EChartColor.GEN_5G_NSA : EChartColor.GEN_5G_SA,
          x,
          signal.nr_rsrp
        )
      }
      if (signal.lte_rsrp == null && signal.nr_rsrp == null) {
        // 2G/3G (or otherwise unclassified) carry only signal_strength
        const is3g = !!signal.cell_info_3G
        addPoint(
          is3g ? EMNT.T_3G : EMNT.T_2G,
          is3g ? EMNT.T_3G : EMNT.T_2G,
          is3g ? EChartColor.GEN_3G_BORDER : EChartColor.GEN_2G_BORDER,
          is3g ? EChartColor.GEN_3G : EChartColor.GEN_2G,
          x,
          signal.signal_strength
        )
      }
    }

    if (this.phaseDurations()?.upStart && this.phaseDurations()?.upDuration) {
      // draw the signal lines until the end of the upload phase
      const lastX = this.getX(
        this.phaseDurations()!.upStart! + this.phaseDurations()!.upDuration!
      )
      for (const dataset of seriesByKey.values()) {
        const lastSignal = dataset.data[dataset.data.length - 1]
        if (lastSignal?.x != null && lastSignal.x < lastX) {
          dataset.data.push({
            x: lastX,
            y: lastSignal.y,
          })
        }
      }
      const pingDataset = new TestChartDataset("ping")
      pingDataset.data.push({
        x: lastX,
        y: 0,
      })
      datasets.push(pingDataset)
    }
    return datasets
  }

  private getPlugins() {
    const plugins: any[] = []
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
