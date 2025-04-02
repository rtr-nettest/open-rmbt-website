/// <reference lib="webworker" />

import { I18nStore } from "../../../i18n/store/i18n.store"
import { EMeasurementStatus } from "../../../test/constants/measurement-status.enum"
import { ITestVisualizationState } from "../../../test/interfaces/test-visualization-state.interface"
import { TestChart } from "../../dto/test-chart"
import { ChartPhase } from "../../dto/test-chart-dataset"
import { BarChart } from "./settings/bar-chart"
import { LogChart } from "./settings/log-chart"

let canvas: OffscreenCanvas | undefined
let chart: TestChart | undefined

addEventListener("message", ({ data }) => {
  switch (data.type) {
    case "initChart":
      canvas = data.canvas
      initChart({ phase: data.phase, i18nStore: data.i18nStore })
      break
    case "handleChanges":
})

function initChart(options?: { phase?: ChartPhase; i18nStore?: I18nStore, force?: boolean }) {
    const { phase = "download", i18nStore, force } = options || {}
    const ctx = canvas?.getContext("2d")
    if (ctx) {
      try {
        if (phase === "ping") {
          chart = new BarChart(ctx!, i18nStore, phase)
        } else {
          chart = new LogChart(ctx!, i18nStore, phase)
        }
      } catch (e) {
        console.warn(phase, e)
      }
    }
  }

function handleChanges(visualization: ITestVisualizationState) {
  initChart()
  try {
    switch (visualization.currentPhaseName) {
      case EMeasurementStatus.INIT:
      case EMeasurementStatus.INIT_DOWN:
      case EMeasurementStatus.PING:
      case EMeasurementStatus.NOT_STARTED:
        chart?.resetData()
        break
      case EMeasurementStatus.DOWN:
        updateDownload(visualization)
        break
      case EMeasurementStatus.UP:
        updateUpload(visualization)
        break
      case EMeasurementStatus.SHOWING_RESULTS:
        initChart({ force: true })
        showResults(visualization)
        break
      case EMeasurementStatus.END:
        showResults(visualization)
        break
    }
  } catch (_) {}
}
