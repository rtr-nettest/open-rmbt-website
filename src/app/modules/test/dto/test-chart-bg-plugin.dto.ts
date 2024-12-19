import { Chart } from "chart.js"
import { EChartBgColor } from "./test-chart-dataset.dto"

export type TestChartBgPluginOptions = {
  id: string
  color: EChartBgColor
  start: number
  duration?: number
}

export class TestChartBgPlugin {
  id!: string
  constructor(private readonly options: TestChartBgPluginOptions) {
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
    const { color, start, duration } = this.options
    ctx.fillStyle = color
    const fullTime = max - min
    const timeFromStartPercent = start / fullTime
    const xLeft = left + timeFromStartPercent * width

    const durationPercent = duration ? duration / fullTime : 0
    const xWidth = durationPercent * width

    ctx.fillRect(xLeft, top, duration ? xWidth : width, height)
  }
}
