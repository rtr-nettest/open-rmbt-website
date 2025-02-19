import { I18nStore } from "../../../../i18n/store/i18n.store"
import { TestChartDataset } from "../../../dto/test-chart-dataset"
import { TestChart } from "../../../dto/test-chart"
import { TestSignalChartOptions } from "./signal-chart-options"

export class TestSignalChart extends TestChart {
  constructor(
    context: CanvasRenderingContext2D,
    i18nStore: I18nStore,
    datasets: TestChartDataset[],
    options: TestSignalChartOptions,
    plugins: any[] = []
  ) {
    super(
      context,
      i18nStore,
      "line",
      {
        datasets,
        labels: [],
      },
      options,
      plugins
    )
  }
}
