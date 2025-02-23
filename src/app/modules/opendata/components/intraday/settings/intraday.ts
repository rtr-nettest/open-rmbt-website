import { Chart } from "chart.js"
import { TestChartDataset } from "../../../../charts/dto/test-chart-dataset"
import { I18nStore } from "../../../../i18n/store/i18n.store"
import { LabelsToLeftPlugin } from "../../../plugins/labels-to-left"
import { IntradayOptions } from "./intraday-options"

export class Intraday extends Chart {
  constructor(
    context: CanvasRenderingContext2D,
    private i18nStore: I18nStore,
    datasets: TestChartDataset[],
    labels: any[],
    options: IntradayOptions,
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
