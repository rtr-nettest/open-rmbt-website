import { Chart } from "chart.js"

export const BAR_WIDTH = 20

export class TestBarChartPlugin {
  // Starts drawing the bars from the left edge of the first bar
  // and ends them at the right edge of the last bar
  beforeDatasetsDraw(chart: Chart): boolean | void {
    const {
      chartArea: { left, width },
    } = chart
    const { data } = chart.getDatasetMeta(0)
    for (const [i, dp] of data.entries()) {
      const gap = ((width - BAR_WIDTH) / (data.length - 1)) * i
      dp.x = left + BAR_WIDTH / 2 + gap
    }
  }
}
