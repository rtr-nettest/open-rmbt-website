import { Chart } from "chart.js"

export class LabelsToLeftPlugin {
  afterDatasetsDraw(chart: Chart): boolean | void {
    const visibleMetas = chart.getSortedVisibleDatasetMetas()
    const d = visibleMetas[0].data[0] as any
    if (!d) {
      return
    }
    let offset = d.width / 2
    if ((chart.options.scales as any)["x"].ticks.labelOffset === -offset) {
      return
    }
    ;(chart.options.scales as any)["x"].ticks.labelOffset = -offset
    chart.update()
  }
}
