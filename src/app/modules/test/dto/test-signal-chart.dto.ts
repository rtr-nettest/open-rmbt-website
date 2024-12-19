import { I18nStore } from "../../i18n/store/i18n.store"
import { generateIndexesOfLength } from "../../shared/util/array"
import { TestChartDataset } from "./test-chart-dataset.dto"
import { TestChart } from "./test-chart.dto"
import { TestSignalChartOptions } from "./test-signal-chart-options.dto"

export class TestSignalChart extends TestChart {
  constructor(
    context: CanvasRenderingContext2D,
    i18nStore: I18nStore,
    datasets: TestChartDataset[],
    options: TestSignalChartOptions
  ) {
    super(
      context,
      i18nStore,
      "line",
      {
        datasets,
        labels: generateIndexesOfLength(100),
      },
      options
    )
  }
}
