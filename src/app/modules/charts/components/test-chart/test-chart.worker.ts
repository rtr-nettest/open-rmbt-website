/// <reference lib="webworker" />

import { I18nStore } from "../../../i18n/store/i18n.store"
import { EMeasurementStatus } from "../../../test/constants/measurement-status.enum"
import { STATE_UPDATE_TIMEOUT } from "../../../test/constants/numbers"
import { ITestVisualizationState } from "../../../test/interfaces/test-visualization-state.interface"
import { TestChart } from "../../dto/test-chart"
import { ChartPhase } from "../../dto/test-chart-dataset"
import { BarChart } from "./settings/bar-chart"
import { LogChart } from "./settings/log-chart"
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  Filler,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  TimeScale,
} from "chart.js"
import "chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm"
import { LogChartOptions } from "./settings/log-chart-options"
import { BarChartOptions } from "./settings/bar-chart-options"

Chart.register(
  BarElement,
  BarController,
  LineElement,
  PointElement,
  LineController,
  CategoryScale,
  LinearScale,
  TimeScale,
  Filler
)

let canvas: HTMLCanvasElement | undefined
let chart: TestChart | undefined
let phase: ChartPhase | undefined
let updateTimer: NodeJS.Timeout | undefined
let i18nStore = new I18nStore()
let devicePixelRatio = 1

addEventListener("message", ({ data }) => {
  switch (data.type) {
    case "initChart":
      phase = data.phase
      canvas = data.canvas
      devicePixelRatio = data.devicePixelRatio
      initChart()
      break
    case "resizeChart":
      const { width, height } = data
      canvas!.width = width
      canvas!.height = height
      chart!.resize()
      break
    case "handleChanges":
      clearInterval(updateTimer)
      updateTimer = setInterval(() => {
        postMessage({ type: "tick" })
      }, STATE_UPDATE_TIMEOUT * 2)
      handleChanges(data.visualization)
      break
    case "stopUpdates":
      clearInterval(updateTimer)
      updateTimer = undefined
      break
  }
})

function initChart() {
  if (!canvas) {
    return
  }
  try {
    if (phase === "ping") {
      chart = new BarChart(
        canvas,
        i18nStore,
        phase,
        new BarChartOptions(i18nStore, devicePixelRatio)
      )
    } else if (phase) {
      chart = new LogChart(
        canvas,
        i18nStore,
        phase,
        new LogChartOptions(i18nStore, devicePixelRatio)
      )
    }
  } catch (e) {
    console.warn(phase, e)
  }
}

function handleChanges(visualization: ITestVisualizationState) {
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
        initChart()
        showResults(visualization)
        break
      case EMeasurementStatus.END:
        showResults(visualization)
        break
    }
  } catch (_) {}
}

function showResults(visualization: ITestVisualizationState) {
  if (!!chart?.finished) {
    return
  }
  if (phase === "download") {
    chart?.setData(visualization.phases[EMeasurementStatus.DOWN])
  } else if (phase === "upload") {
    chart?.setData(visualization.phases[EMeasurementStatus.UP])
  } else if (phase === "ping") {
    chart?.setData(visualization.phases[EMeasurementStatus.PING])
  }
}

function updateDownload(visualization: ITestVisualizationState) {
  if (phase === "download") {
    chart?.updateData(visualization.phases[EMeasurementStatus.DOWN])
  } else if (phase === "ping" && !chart?.finished) {
    chart?.setData(visualization.phases[EMeasurementStatus.PING])
  } else if (phase === "upload" && chart?.data.datasets[0].data.length) {
    chart?.resetData()
  }
}

function updateUpload(visualization: ITestVisualizationState) {
  if (phase === "upload") {
    chart?.updateData(visualization.phases[EMeasurementStatus.UP])
  } else if (phase === "download" && !chart?.finished) {
    chart?.setData(visualization.phases[EMeasurementStatus.DOWN])
  } else if (phase === "ping" && !chart?.finished) {
    chart?.setData(visualization.phases[EMeasurementStatus.PING])
  }
}
