import { Point } from "chart.js"

export type ChartPhase = "download" | "upload" | "ping" | "signal"
export type BarOptions = {
  barPercentage?: number
  barThickness: number | string
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
      this.backgroundColor = "rgba(108, 209, 95, 0.33)"
      this.borderColor = "rgba(108, 209, 95, 1)"
    } else if (phase === "upload") {
      this.backgroundColor = "rgba(0, 128, 193, 0.33)"
      this.borderColor = "rgba(0, 128, 193, 1)"
    } else if (phase === "signal") {
      this.backgroundColor = "rgba(209, 144, 16, 0.33)"
      this.borderColor = "rgba(209, 144, 16, 1)"
    } else {
      this.backgroundColor = "rgb(39, 177, 220)"
      this.borderColor = "transparent"
      Object.assign(this, barOptions)
    }
  }
}
