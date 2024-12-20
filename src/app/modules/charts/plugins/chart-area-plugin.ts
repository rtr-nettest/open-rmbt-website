import { Chart } from "chart.js"
import { ITestChartPluginOptions } from "../../charts/interfaces/test-chart-plugin.interface"

export class ChartAreaPlugin {
  id!: string
  constructor(private readonly options: ITestChartPluginOptions) {
    this.id = options.id
  }

  beforeDatasetsDraw(chart: Chart): boolean | void {
    const {
      chartArea: { top, left, width, height },
      scales: {
        x: { min, max },
      },
      ctx,
    } = chart
    const { color, x, duration } = this.options
    ctx.fillStyle = color || "rgba(0, 0, 0, 0.1)"
    const fullTime = max - min
    const timeFromStartPercent = x / fullTime
    const xLeft = left + timeFromStartPercent * width

    const durationPercent = duration ? duration / fullTime : 0
    const xWidth = durationPercent * width

    ctx.fillRect(xLeft, top, duration ? xWidth : width, height)
  }
}
