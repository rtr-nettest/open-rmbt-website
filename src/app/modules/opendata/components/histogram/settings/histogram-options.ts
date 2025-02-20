import { EColors } from "../../../../shared/constants/colors.enum"
import { I18nStore } from "../../../../i18n/store/i18n.store"
import { FormatterService } from "../../../services/formatter.service"
import { formatNumber } from "../../../../shared/util/math"

export class HistogramOptions {
  animation = {
    duration: 0,
  }
  layout = {
    padding: {
      left: 0,
      right: 0,
    },
  }
  maintainAspectRatio = false
  normalized = true
  parsing = false as const
  scales = {
    x: {
      ticks: {
        autoSkip: false,
        color: EColors.SECONDARY_50,
        stepSize: 1,
        font: {
          size: 12,
        },
        callback: (value: any, index: number) => {
          return this.formatter.format(value, index)
        },
      },
    },
    x1: {
      type: "linear" as const,
      display: false,
    },
    y: {
      beginAtZero: true,
      grid: {
        color: EColors.SECONDARY_10,
        drawOnChartArea: false,
      },
      ticks: {
        color: EColors.SECONDARY_50,
        font: {
          size: 12,
        },
        count: 5,
        callback: (v: any) => {
          if (v >= 1000000) {
            if (v >= 10000000) {
              return (
                formatNumber(v / 1000000, 0) +
                " " +
                this.t.translate("Mio_abbr")
              )
            } else {
              return (
                formatNumber(v / 1000000, 1) +
                " " +
                this.t.translate("Mio_abbr")
              )
            }
          } else if (v > 1000) {
            if (v >= 10000) {
              return (
                formatNumber(v / 1000, 0) + " " + this.t.translate("Thou_abbr")
              )
            } else {
              return (
                formatNumber(v / 1000, 1) + " " + this.t.translate("Thou_abbr")
              )
            }
          }
          return v
        },
      },
    },
    y1: {
      beginAtZero: true,
      grid: {
        color: EColors.SECONDARY_10,
      },
      min: 0,
      max: 1,
      position: "right",
      ticks: {
        stepSize: 0.25,
        color: EColors.SECONDARY_50,
        font: {
          size: 12,
        },
        callback: (v: any) => {
          return v * 100 + "%"
        },
      },
    },
  }
  plugins = {
    legend: {
      display: false,
    },
    tooltip: {
      enabled: false,
    },
  }

  constructor(
    private t: I18nStore,
    private formatter: FormatterService,
    private clickHandler: (lowerBound: string, upperBound: string) => void
  ) {}

  onClick = (event: any, clickedElements: any[]) => {
    if (clickedElements.length === 0) return

    const { dataIndex } = clickedElements[0].element.$context
    const lowerBound = event.chart.data.labels[dataIndex]
    const upperBound = event.chart.data.labels[dataIndex + 1]
    if (lowerBound !== undefined) {
      this.clickHandler(lowerBound, upperBound)
    }
  }

  onHover = (event: any, elements: any[]) => {
    if (!elements.length) {
      event.native.target.style.cursor = "default"
      return
    }
    const { dataIndex } = elements[0].element.$context
    const lowerBound = event.chart.data.labels[dataIndex]
    if (lowerBound !== undefined) {
      event.native.target.style.cursor = "pointer"
    }
  }
}
