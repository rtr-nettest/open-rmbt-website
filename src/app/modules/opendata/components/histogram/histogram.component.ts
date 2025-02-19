import {
  AfterViewInit,
  Component,
  computed,
  effect,
  input,
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
import { IOpendataFilters } from "../../interfaces/opendata-filters.interface"
import { DEFAULT_FILTERS } from "../../store/opendata-store.service"
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
  filters = input<IOpendataFilters>()
  loading = input<boolean>(true)

  get canvas() {
    return document.getElementById(this.id()) as HTMLCanvasElement
  }

  constructor(
    private readonly i18nStore: I18nStore,
    private readonly service: OpendataService
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
    const filters = { ...this.filters() }
    for (const key in DEFAULT_FILTERS) {
      delete (filters as any)[key]
    }
    if (ctx) {
      this.service
        .getHistogram({
          phase,
          filters,
        })
        .subscribe((response) => {
          const metric = (
            phase === "ping" ? `${phase}_ms` : `${phase}_kbit`
          ) as HistogramMetric
          const data = response[metric]!
          const fineData = response[`${metric}_fine`]!
          const datasets = this.getDatasets(data, fineData)
          const labels = data.map((item) => item.lower_bound)
          const options = this.getOptions(data)
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

  private getOptions(data: IHistogramResponseItem[]): HistogramOptions {
    const max = data[data.length - 2].upper_bound
    const min = data[0].lower_bound
    return new HistogramOptions(
      this.i18nStore,
      this.phase() === "ping"
        ? new PingFormatterService(min, max)
        : new SpeedFormatterService(min, max)
    )
  }

  private getDatasets(
    data: IHistogramResponseItem[],
    fineData: IHistogramResponseItem[]
  ): any {
    const datasets: HistogramDataset[] = []

    // Bars
    const barDataset = new HistogramDataset(this.phase(), "bar", "y")
    barDataset.data = data.map((item, i) => {
      return {
        x: i,
        y: item.results,
      }
    })
    datasets.push(barDataset)

    // Line
    const lineDataset = new HistogramDataset(this.phase(), "line", "y1")
    const fineFactor = Math.round(
      fineData.length /
        (data[data.length - 1].upper_bound === null
          ? data.length - 1
          : data.length)
    )

    let total = 0
    lineDataset.data = fineData.map((item, i) => {
      const y = total
      total += fineData[i].results
      return {
        x: i / fineFactor,
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
    console.log(datasets)
    return datasets
  }
}
