import { Point } from "chart.js"
import { I18nStore } from "../../../../i18n/store/i18n.store"
import { generateIndexesOfLength } from "../../../../shared/util/array"
import {
  ChartPhase,
  TestChartDataset,
} from "../../../models/test-chart-dataset"
import { TestChart } from "../../../models/test-chart"
import { ITestPhaseState } from "../../../../test/interfaces/test-phase-state.interface"
import { LogChartOptions } from "./log-chart-options"

export class LogChart extends TestChart {
  constructor(
    context: CanvasRenderingContext2D,
    i18nStore: I18nStore,
    private phase: ChartPhase
  ) {
    super(
      context,
      i18nStore,
      "line",
      {
        datasets: [new TestChartDataset(phase)],
        labels: generateIndexesOfLength(8),
      },
      new LogChartOptions(i18nStore)
    )
  }

  override setData(data: ITestPhaseState) {
    this.resetDatasets()
    this.data.datasets[0].data = this.getAllData(data)
    const lastIndex = Math.ceil(
      (
        this.data.datasets[0].data[
          this.data.datasets[0].data.length - 1
        ] as Point
      ).x
    )
    const { labels } = this.data
    if (labels && labels.length <= lastIndex) {
      while (labels!.length <= lastIndex) {
        labels.push(lastIndex)
      }
    }
    this.update()
  }

  override updateData(data: ITestPhaseState) {
    const lastData = super.getLastData(data)
    if (!lastData) {
      return
    }
    const lastIndex = Math.ceil(lastData.x)
    this.data.datasets[0].data.push(lastData)
    if (this.data.labels && this.data.labels.length <= lastIndex)
      this.data.labels.push(lastIndex)
    super.update()
  }

  protected override resetDatasets(): void {
    this.data.datasets = [new TestChartDataset(this.phase)]
  }

  protected override resetLabels(): void {
    this.data.labels = generateIndexesOfLength(8)
  }

  protected override getAllData(testItem: ITestPhaseState) {
    return testItem.chart?.length ? testItem.chart : []
  }
}
