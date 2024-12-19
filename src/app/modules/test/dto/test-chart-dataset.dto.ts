import { Point } from "chart.js"

export type ChartPhase = "download" | "upload" | "ping" | "signal"
export type BarOptions = {
  barPercentage?: number
  barThickness: number | string
}
export enum EChartBgColor {
  DOWNLOAD = "rgba(108, 209, 95, 0.33)",
  UPLOAD = "rgba(0, 128, 193, 0.33)",
  PING = "rgb(39, 177, 220)",
  SIGNAL = "rgba(209, 144, 16, 0.33)",
}

export class TestChartDataset {
  fill = true
  backgroundColor!: string
  borderColor!: string
  borderCapStyle: "round" = "round"
  pointBackgroundColor = "transparent"
  pointBorderColor = "transparent"
  pointHoverBackgroundColor = "transparent"
  pointHoverBorderColor = "transparent"
  data: Point[] = []

  constructor(
    phase: ChartPhase,
    barOptions: BarOptions = {
      barPercentage: 0.3,
      barThickness: "flex",
    }
  ) {
    if (phase === "download") {
      this.backgroundColor = EChartBgColor.DOWNLOAD
      this.borderColor = "rgba(108, 209, 95, 1)"
    } else if (phase === "upload") {
      this.backgroundColor = EChartBgColor.UPLOAD
      this.borderColor = "rgba(0, 128, 193, 1)"
    } else if (phase === "signal") {
      this.backgroundColor = EChartBgColor.SIGNAL
      this.borderColor = "rgba(209, 144, 16, 1)"
    } else {
      this.backgroundColor = EChartBgColor.PING
      this.borderColor = "transparent"
      Object.assign(this, barOptions)
    }
  }
}
