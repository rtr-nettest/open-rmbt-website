import { Chart } from "chart.js"
import { ITestChartPluginOptions } from "../interfaces/test-chart-plugin.interface"
import { EColors } from "../../shared/constants/colors.enum"

export class FenceLinePlugin {
  id!: string
  constructor(private readonly options: ITestChartPluginOptions) {
    this.id = options.id
  }

  afterDatasetsDraw(chart: Chart): boolean | void {
    const {
      chartArea: { top, bottom, left, width },
      scales: {
        x: { min, max },
      },
      ctx,
    } = chart
    const { x, color } = this.options

    // Convert elapsed ms to chart coordinates
    const fullTime = max - min
    const xPos = left + (x / fullTime) * width

    if (xPos < left || xPos > left + width) {
      return
    }

    ctx.save()
    ctx.beginPath()
    ctx.lineWidth = 1
    ctx.strokeStyle = (color as string) || EColors.PRIMARY_50
    ctx.setLineDash([3, 5])
    ctx.moveTo(xPos, top)
    ctx.lineTo(xPos, bottom)
    ctx.stroke()
    ctx.restore()
  }
}
