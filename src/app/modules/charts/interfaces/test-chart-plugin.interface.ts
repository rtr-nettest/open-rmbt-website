import { EChartColor } from "../dto/test-chart-dataset"

export interface ITestChartPluginOptions {
  id: string
  color?: EChartColor | string
  x: number
  y?: number
  duration?: number
  text?: string
}
