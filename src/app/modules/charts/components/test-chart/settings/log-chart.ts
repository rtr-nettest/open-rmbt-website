import { Point } from "chart.js"
import { I18nStore } from "../../../../i18n/store/i18n.store"
import { generateIndexesOfLength } from "../../../../shared/util/array"
import { ChartPhase, TestChartDataset } from "../../../dto/test-chart-dataset"
import { TestChart } from "../../../dto/test-chart"
import { ITestPhaseState } from "../../../../test/interfaces/test-phase-state.interface"
import { LogChartOptions } from "./log-chart-options"

export class LogChart extends TestChart {
  constructor(
    context: CanvasRenderingContext2D,
    i18nStore: I18nStore,
    private phase: ChartPhase,
    maxValue?: number
  ) {
    super(
      context,
      i18nStore,
      "line",
      {
        datasets: [new TestChartDataset(phase)],
        labels: generateIndexesOfLength(8),
      },
      new LogChartOptions(i18nStore, maxValue)
    )
  }

  override setData(data: ITestPhaseState) {
    this.resetDatasets()
    this.data.datasets[0].data = this.getAllData(data)
    const firstZeroIndex = this.data.datasets[0].data.findIndex(
      (point) => (point as Point).x === 0
    )
    if (firstZeroIndex !== -1) {
      this.data.datasets[0].data = this.data.datasets[0].data.slice(
        firstZeroIndex + 1
      )
    }
    const lastIndex = Math.ceil(
      (
        this.data.datasets[0].data[
          this.data.datasets[0].data.length - 1
        ] as Point
      ).x
    )
    const { labels } = this.data
    if (labels) {
      if (labels.length <= lastIndex) {
        while (labels!.length <= lastIndex) {
          labels.push(lastIndex)
        }
      }
    }
    if (this.options.scales?.["x"]) {
      this.options.scales["x"].max = Math.max(7, lastIndex)
    }
    this.finished = true
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
    if (this.options.scales?.["x"]) {
      this.options.scales["x"].max = Math.max(7, lastIndex)
    }
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
