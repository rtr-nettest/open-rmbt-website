import {
  BarOptions,
  ChartPhase,
  EChartColor,
  TestChartDataset,
} from "../../../../charts/dto/test-chart-dataset"

export class HistogramDataset extends TestChartDataset {
  constructor(
    phase: ChartPhase,
    private type: "bar" | "line",
    private xAxisID: string,
    private yAxisID: string,
    barOptions: BarOptions = {
      categoryPercentage: 1,
      barPercentage: 1,
      barThickness: "flex",
    }
  ) {
    super(phase, barOptions)
    this.fill = type === "bar"
    if (phase === "ping") {
      this.borderColor = EChartColor.PING
      if (type === "bar") {
        this.backgroundColor = EChartColor.PING_SEMI
      }
    }
    if (type === "bar") {
      Object.assign(this, barOptions)
    }
  }
}
