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
      const techLabels: ITestChartPluginOptions[] = []
      const minSignal = this.getMinSignal()
      const datasets = this.getDatasets(minSignal, techLabels)
      const plugins = this.getPlugins(techLabels)
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

  /** Readings within this many ms are treated as the same moment. */
  private static readonly SAMPLE_MERGE_TOLERANCE_MS = 5

  /**
   * Merges signal samples whose timestamps are within
   * `SAMPLE_MERGE_TOLERANCE_MS` of each other into one. This folds a 4G reading
   * and a separately reported 5G-SA reading taken at (nearly) the same time into
   * a single sample carrying both `lte_rsrp` and `nr_rsrp` - so that 5G is
   * treated as NSA (an LTE anchor is present) instead of Standalone, and the 4G
   * line does not fragment across the interleaved rows.
   */
  private mergeSamplesByTimestamp(
    samples: ISimpleHistorySignal[]
  ): ISimpleHistorySignal[] {
    const tolerance = SignalChartComponent.SAMPLE_MERGE_TOLERANCE_MS
    const groups: ISimpleHistorySignal[] = []
    for (const sample of samples) {
      const existing = groups.find(
        (group) => Math.abs(group.time_elapsed - sample.time_elapsed) <= tolerance
      )
      if (!existing) {
        groups.push({ ...sample })
        continue
      }
      existing.lte_rsrp = existing.lte_rsrp ?? sample.lte_rsrp
      existing.nr_rsrp = existing.nr_rsrp ?? sample.nr_rsrp
      existing.cell_info_2G = existing.cell_info_2G ?? sample.cell_info_2G
      existing.cell_info_3G = existing.cell_info_3G ?? sample.cell_info_3G
      existing.cell_info_4G = existing.cell_info_4G ?? sample.cell_info_4G
      existing.cell_info_5G = existing.cell_info_5G ?? sample.cell_info_5G
    }
    return groups
  }

  /**
   * Builds one line per technology present in the test (4G, 5G NSA, 5G SA, 3G,
   * 2G), each drawn in its own colour. A line only connects consecutive samples
   * of the same technology; a technology change breaks the line, and lines are
   * never extended before the first or after the last real sample.
   *
   * During NSA a sample carries both `lte_rsrp` and `nr_rsrp`, so it feeds both
   * the 4G line (the LTE anchor) and the 5G-NSA line at once. A single stray
   * pure-4G sample does not end the 5G-NSA line - only two or more consecutive
   * pure-4G samples do (`nsaGapTolerance`).
   *
   * For every technology a text label is collected in `techLabels`, positioned
   * where the technology first appears, so the chart keeps naming the displayed
   * technologies as it did before.
   */
  private getDatasets(
    minSignal: number,
    techLabels: ITestChartPluginOptions[]
  ) {
    const datasets: TestChartDataset[] = []
    const signals = this.mergeSamplesByTimestamp(this.signal())
    const getY = (value: number) => minSignal - Math.abs(value)

    const has4G = (s: ISimpleHistorySignal) => s.lte_rsrp != null
    const has5G = (s: ISimpleHistorySignal) => s.nr_rsrp != null

    // Build the segmented line for a single technology. Consecutive present
    // samples are connected; a run of absent samples longer than `gapTolerance`
    // breaks the line into a new segment. Segments of one technology share the
    // colour and label but only the first contributes a chart label.
    const addLine = (
      key: string,
      label: string,
      borderColor: string,
      backgroundColor: string,
      present: (s: ISimpleHistorySignal) => boolean,
      value: (s: ISimpleHistorySignal) => number,
      gapTolerance: number
    ) => {
      let segment: TestChartDataset | undefined
      let gapRun = 0
      let labelled = false
      for (const signal of signals) {
        if (!present(signal)) {
          gapRun++
          continue
        }
        if (segment && gapRun > gapTolerance) {
          // the preceding absence was long enough to end the current segment
          segment = undefined
        }
        if (!segment) {
          segment = new TestChartDataset("signal")
          segment.label = label
          segment.borderColor = borderColor
          segment.backgroundColor = backgroundColor
          // dot marker on every real signal sample of this line
          segment.pointRadius = 2
          segment.pointBackgroundColor = borderColor
          segment.pointBorderColor = borderColor
          datasets.push(segment)
          if (!labelled) {
            // stack labels of concurrent technologies so they do not overlap
            techLabels.push({
              id: `tech-${key}`,
              x: signal.time_elapsed,
              y: 12 + techLabels.length * 16,
              text: label,
              color: borderColor,
            })
            labelled = true
          }
        }
        segment.data.push({
          x: this.getX(signal.time_elapsed),
          y: getY(value(signal)),
        })
        gapRun = 0
      }
    }

    // 4G: LTE anchor, present for both pure-4G and NSA samples. Breaks as soon
    // as LTE is gone (e.g. a 5G-SA sample); an NSA sample never ends it.
    addLine(
      EMNT.T_4G,
      EMNT.T_4G,
      EChartColor.GEN_4G_BORDER,
      EChartColor.GEN_4G,
      (s) => has4G(s),
      (s) => s.lte_rsrp!,
      0
    )
    // 5G NSA: NR alongside an LTE anchor. Tolerates a single stray pure-4G
    // sample; two or more consecutive pure-4G samples end it.
    addLine(
      EMNT.T_5G_NSA,
      "5G",
      EChartColor.GEN_5G_NSA_BORDER,
      EChartColor.GEN_5G_NSA,
      (s) => has5G(s) && has4G(s),
      (s) => s.nr_rsrp!,
      1
    )
    // 5G SA: NR without an LTE anchor.
    addLine(
      EMNT.T_5G_SA,
      "5G",
      EChartColor.GEN_5G_SA_BORDER,
      EChartColor.GEN_5G_SA,
      (s) => has5G(s) && !has4G(s),
      (s) => s.nr_rsrp!,
      0
    )
    // 3G / 2G: no RSRP, only signal_strength.
    addLine(
      EMNT.T_3G,
      EMNT.T_3G,
      EChartColor.GEN_3G_BORDER,
      EChartColor.GEN_3G,
      (s) => !has4G(s) && !has5G(s) && !!s.cell_info_3G,
      (s) => s.signal_strength,
      0
    )
    addLine(
      EMNT.T_2G,
      EMNT.T_2G,
      EChartColor.GEN_2G_BORDER,
      EChartColor.GEN_2G,
      (s) => !has4G(s) && !has5G(s) && !s.cell_info_3G,
      (s) => s.signal_strength,
      0
    )

    // Keep the time axis spanning the whole test (through the upload/ping
    // phases) so the phase bands stay aligned - the signal lines themselves end
    // at their last real sample, but this invisible anchor holds the axis end.
    if (this.phaseDurations()?.upStart && this.phaseDurations()?.upDuration) {
      const axisAnchor = new TestChartDataset("ping")
      axisAnchor.data.push({
        x: this.getX(
          this.phaseDurations()!.upStart! + this.phaseDurations()!.upDuration!
        ),
        y: 0,
      })
      datasets.push(axisAnchor)
    }

    return datasets
  }

  private getPlugins(techLabels: ITestChartPluginOptions[]) {
    const plugins: any[] = []
    for (const label of techLabels) {
      plugins.push(
        new TimeIntervalNamePlugin({
          id: label.id,
          text: label.text,
          x: label.x,
          y: label.y,
          color: label.color,
        })
      )
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
