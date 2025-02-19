import { EChartColor } from "../dto/test-chart-dataset"

export interface ITestChartPluginOptions {
  id: string
  color?: EChartColor
  x: number
  y?: number
  duration?: number
  text?: string
}
