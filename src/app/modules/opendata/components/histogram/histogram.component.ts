import {
  AfterViewInit,
  Component,
  computed,
  effect,
  input,
  signal,
} from "@angular/core"
import {
  HistogramMetric,
  IHistogramResponseItem,
} from "../../../opendata/interfaces/histogram-response.interface"
import { Histogram } from "./settings/histogram"
import { HistogramOptions } from "./settings/histogram-options"
import { I18nStore } from "../../../i18n/store/i18n.store"
import { PingFormatterService } from "../../services/ping-formatter.service"
import { SpeedFormatterService } from "../../services/speed-formatter.service"
import { HistogramDataset } from "./settings/histogram-dataset"
import { ChartPhase } from "../../../charts/dto/test-chart-dataset"
import { OpendataService } from "../../services/opendata.service"
import {
  DEFAULT_FILTERS,
  OpendataStoreService,
} from "../../store/opendata-store.service"
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner"

@Component({
  selector: "app-histogram",
  imports: [MatProgressSpinnerModule],
  templateUrl: "./histogram.component.html",
  styleUrl: "./histogram.component.scss",
})
export class HistogramComponent implements AfterViewInit {
  chart!: Histogram
  id = computed(() => `${this.phase()}_histogram`)
  phase = input.required<ChartPhase>()
  loading = signal<boolean>(true)

  get canvas() {
    return document.getElementById(this.id()) as HTMLCanvasElement
  }

  constructor(
    private readonly i18nStore: I18nStore,
    private readonly service: OpendataService,
    private readonly store: OpendataStoreService
  ) {
    effect(() => {
      this.initChart()
    })
  }

  ngAfterViewInit(): void {
    this.initChart()
  }

  private initChart() {
    this.chart?.destroy()
    const ctx = this.canvas?.getContext("2d")
    const phase = this.phase()
    const filters = { ...this.store.filters() }
    for (const key in DEFAULT_FILTERS) {
      delete (filters as any)[key]
    }
    if (ctx) {
      this.loading.set(true)
      this.service
        .getHistogram({
          phase,
          filters,
        })
        .subscribe((response) => {
          this.loading.set(false)
          const metric = (
            phase === "ping" ? `${phase}_ms` : `${phase}_kbit`
          ) as HistogramMetric
          const data = response[metric]!
          const fineData = response[`${metric}_fine`]!
          const datasets = this.getDatasets(data, fineData)
          const labels = data.map((item) => item.lower_bound.toString())
          const options = this.getOptions(data, labels)
          this.chart = new Histogram(
            ctx,
            this.i18nStore,
            datasets,
            labels,
            options
          )
        })
    }
  }

  private getOptions(
    data: IHistogramResponseItem[],
    labels: string[]
  ): HistogramOptions {
    const max = data[data.length - 2].upper_bound
    const min = data[0].lower_bound
    return new HistogramOptions(
      this.i18nStore,
      this.phase() === "ping"
        ? new PingFormatterService(this.i18nStore, labels, min, max)
        : new SpeedFormatterService(this.i18nStore, labels, min, max),
      this.setFilters
    )
  }

  private getDatasets(
    data: IHistogramResponseItem[],
    fineData: IHistogramResponseItem[]
  ): any {
    const datasets: HistogramDataset[] = []

    // Bars
    const barDataset = new HistogramDataset(this.phase(), "bar", "x", "y")
    barDataset.data = data.map((item, i) => {
      return {
        x: i,
        y: item.results,
      }
    })
    datasets.push(barDataset)

    // Line
    const lineDataset = new HistogramDataset(this.phase(), "line", "x1", "y1")
    const fineFactor = Math.round(
      fineData.length /
        (data[data.length - 1].upper_bound === null
          ? data.length - 1
          : data.length)
    )
    const spaceTakenInChart = 1 / data.length

    let total = 0
    lineDataset.data = fineData.map((item, i) => {
      const y = total
      total += fineData[i].results
      return {
        x: (i / fineFactor) * spaceTakenInChart,
        y,
      }
    })

    //now, to percent
    for (let i = 0; i < lineDataset.data.length; i++) {
      const { x, y } = lineDataset.data[i]
      lineDataset.data[i] = {
        x,
        y: y / total,
      }
    }
    datasets.push(lineDataset)
    return datasets
  }

  private setFilters = (lowerBound: string, upperBound: string) => {
    const filters = { ...this.store.filters() }
    const from = parseFloat(lowerBound) / 1000
    const to = parseFloat(upperBound) / 1000
    switch (this.phase()) {
      case "ping":
        filters.ping_ms_from = lowerBound
        filters.ping_ms_to = upperBound
        break
      case "download":
        filters.download_kbit_from = from.toString()
        filters.download_kbit_to = to.toString()
        break
      case "upload":
        filters.download_kbit_from = from.toString()
        filters.download_kbit_to = to.toString()
        break
    }
    console.log(filters)
    this.service.applyFilters(filters)
  }
}
