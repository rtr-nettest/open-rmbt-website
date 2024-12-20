import { EChartColor } from "../models/test-chart-dataset"

export interface ITestChartPluginOptions {
  id: string
  color?: EChartColor
  x: number
  y?: number
  duration?: number
  text?: string
}
