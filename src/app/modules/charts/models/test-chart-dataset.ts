import { Point } from "chart.js"

export type ChartPhase = "download" | "upload" | "ping" | "signal"
export type BarOptions = {
  barPercentage?: number
  barThickness: number | string
}
export enum EChartColor {
  DOWNLOAD = "rgba(108, 209, 95, 0.33)",
  UPLOAD = "rgba(0, 128, 193, 0.33)",
  PING = "rgb(39, 177, 220)",
  SIGNAL = "rgba(209, 144, 16, 0.33)",
  DOWNLOAD_BORDER = "rgba(108, 209, 95, 1)",
  UPLOAD_BORDER = "rgba(0, 128, 193, 1)",
  SIGNAL_BORDER = "rgba(209, 144, 16, 1)",
  PING_BORDER = "transparent",
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
      this.backgroundColor = EChartColor.DOWNLOAD
      this.borderColor = EChartColor.DOWNLOAD_BORDER
    } else if (phase === "upload") {
      this.backgroundColor = EChartColor.UPLOAD
      this.borderColor = EChartColor.UPLOAD_BORDER
    } else if (phase === "signal") {
      this.backgroundColor = EChartColor.SIGNAL
      this.borderColor = EChartColor.SIGNAL_BORDER
    } else {
      this.backgroundColor = EChartColor.PING
      this.borderColor = EChartColor.PING_BORDER
      Object.assign(this, barOptions)
    }
  }
}
