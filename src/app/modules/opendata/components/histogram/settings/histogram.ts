import { Chart } from "chart.js"
import { TestChart } from "../../../../charts/dto/test-chart"
import { TestChartDataset } from "../../../../charts/dto/test-chart-dataset"
import { I18nStore } from "../../../../i18n/store/i18n.store"
import { HistogramOptions } from "./histogram-options"

export class Histogram extends Chart {
  constructor(
    context: CanvasRenderingContext2D,
    private i18nStore: I18nStore,
    datasets: TestChartDataset[],
    labels: any[],
    options: HistogramOptions,
    plugins: any[] = []
  ) {
    super(context, {
      type: "line",
      data: {
        datasets,
        labels,
      },
      options,
      plugins,
    })
  }
}
