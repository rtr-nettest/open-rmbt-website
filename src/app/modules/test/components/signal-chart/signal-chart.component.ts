import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  input,
} from "@angular/core"
import { ISimpleHistorySignal } from "../../interfaces/simple-history-result.interface"
import { TestSignalChart } from "../../dto/test-signal-chart.dto"
import { I18nStore } from "../../../i18n/store/i18n.store"
import { TestChartDataset } from "../../dto/test-chart-dataset.dto"
import dayjs from "dayjs"
import { TestSignalChartOptions } from "../../dto/test-signal-chart-options.dto"

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
  details = input<ISimpleHistorySignal[]>([])
  chart!: TestSignalChart

  get canvas() {
    return document.getElementById(this.id) as HTMLCanvasElement
  }

  constructor(private readonly i18nStore: I18nStore) {}

  ngAfterViewInit(): void {
    const ctx = this.canvas?.getContext("2d")
    const datasets: TestChartDataset[] = []
    let currentNetworkType = ""
    let currentDataset: TestChartDataset
    let containsLTE = false
    let minSignal = Math.min(
      ...this.details().map((signal) => {
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
    minSignal = Math.abs(Math.min(minSignal, containsLTE ? -140 : -120))

    for (const signal of this.details()) {
      if (signal.network_type != currentNetworkType) {
        currentNetworkType = signal.network_type
        currentDataset = new TestChartDataset("signal")
        datasets.push(currentDataset)
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
    if (ctx) {
      this.chart = new TestSignalChart(
        ctx,
        this.i18nStore,
        datasets,
        new TestSignalChartOptions(this.i18nStore, minSignal)
      )
    }
  }
}
