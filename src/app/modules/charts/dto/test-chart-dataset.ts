import { Point } from "chart.js"

export type ChartPhase = "download" | "upload" | "ping" | "signal"
export type BarOptions = {
  barPercentage?: number
  barThickness: number | string
  categoryPercentage?: number
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
  PING_SEMI = "rgba(39, 177, 220, 0.33)",
  // Per-technology signal lines (fill / border)
  GEN_2G = "rgba(255, 222, 0, 0.33)", // #FFDE00
  GEN_2G_BORDER = "rgba(255, 222, 0, 1)",
  GEN_3G = "rgba(239, 255, 0, 0.33)", // #EFFF00
  GEN_3G_BORDER = "rgba(239, 255, 0, 1)",
  GEN_4G = "rgba(0, 222, 255, 0.33)", // #00DEFF
  GEN_4G_BORDER = "rgba(0, 222, 255, 1)",
  GEN_5G_SA = "rgba(94, 0, 255, 0.33)", // #5E00FF
  GEN_5G_SA_BORDER = "rgba(94, 0, 255, 1)",
  GEN_5G_NSA = "rgba(0, 145, 255, 0.33)", // #0091FF
  GEN_5G_NSA_BORDER = "rgba(0, 145, 255, 1)",
}

export class TestChartDataset {
  fill = true
  label?: string
  backgroundColor!: string
  borderColor!: string
  borderCapStyle: "round" = "round"
  pointRadius?: number
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
