import { TestChart } from "../../../dto/test-chart"
import { BarChartOptions } from "./bar-chart-options"
import { I18nStore } from "../../../../i18n/store/i18n.store"
import {
  BarOptions,
  ChartPhase,
  TestChartDataset,
} from "../../../dto/test-chart-dataset"
import { ITestPhaseState } from "../../../../test/interfaces/test-phase-state.interface"
import {
  PingBarChartPlugin,
  getBarWidth,
} from "../../../plugins/ping-bar-chart-plugin"

export class BarChart extends TestChart {
  private barOptions?: BarOptions

  constructor(
    context: CanvasRenderingContext2D,
    i18nStore: I18nStore,
    private phase: ChartPhase
  ) {
    super(
      context,
      i18nStore,
      "bar",
      {
        datasets: [],
        labels: [],
      },
      new BarChartOptions(i18nStore),
      [new PingBarChartPlugin()]
    )
  }

  override setData(data: ITestPhaseState) {
    const allData = this.getAllData(data)
    this.barOptions = {
      barThickness: getBarWidth(allData), // the more bars the thinner they are
    }
    this.resetDatasets()
    this.data.datasets[0].data = allData
    this.finished = true
    this.update()
  }

  protected override resetDatasets(): void {
    this.data.datasets = [new TestChartDataset(this.phase, this.barOptions)]
  }

  protected override resetLabels(): void {
    this.data.labels = []
  }

  protected override getAllData(testItem: ITestPhaseState) {
    return testItem.chart?.length ? testItem.chart : []
  }
}
