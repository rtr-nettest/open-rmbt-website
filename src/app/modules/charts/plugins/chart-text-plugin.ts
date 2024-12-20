import { Chart } from "chart.js"
import { EColors } from "../../shared/constants/colors.enum"
import { ITestChartPluginOptions } from "../../charts/interfaces/test-chart-plugin.interface"

export class ChartTextPlugin {
  id!: string
  constructor(private readonly options: ITestChartPluginOptions) {
    this.id = options.id
  }

  beforeDatasetsDraw(chart: Chart): boolean | void {
    if (!this.options.text) {
      return
    }
    const {
      chartArea: { top, left, width },
      scales: {
        x: { min, max },
      },
      ctx,
    } = chart
    const { x, y, text } = this.options
    ctx.font = "12px 'Open Sans'"
    ctx.fillStyle = EColors.SECONDARY_60
    const fullTime = max - min
    const timeFromStartPercent = x / fullTime
    const xLeft = left + timeFromStartPercent * width + 4
    const textParts = text.split("\n")
    if (textParts.length > 1) {
      textParts.forEach((part, i) => {
        ctx.fillText(part, xLeft, top + (y ?? 0) + i * 14)
      })
      return
    }

    ctx.fillText(text, xLeft, top + (y ?? 0))
  }
}
