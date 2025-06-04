import { I18nStore } from "../../../../i18n/store/i18n.store"
import { EColors } from "../../../../shared/constants/colors.enum"
import { roundToSignificantDigits } from "../../../../shared/util/math"

export class LogChartOptions {
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
      type: "linear",
      min: 0,
      max: 7,
      minRotation: 0,
      maxRotation: 0,
      grid: {
        color: EColors.SECONDARY_10,
      },
      title: {
        display: true,
        color: EColors.SECONDARY_50,
        font: {
          size: 12,
        },
      },
      ticks: {
        stepSize: 1,
        callback: (value: any) =>
          `${roundToSignificantDigits(value).toLocaleString(
            this.t.activeLang
          )} ${this.t.translate("s")}`,
      },
    },
    y: {
      beginAtZero: true,
      min: 0,
      max: 1,
      minRotation: 0,
      maxRotation: 0,
      grid: {
        color: EColors.SECONDARY_10,
      },
      title: {
        display: true,
        color: EColors.SECONDARY_50,
        font: {
          size: 12,
        },
      },
      ticks: {
        color: EColors.SECONDARY_50,
        font: {
          size: 12,
        },
        stepSize: 0.2,
        autoSkip: false,
        callback: (value: any, index: number) => {
          let retVal = 0.1
          if (index > 0) {
            retVal = 10 ** (index - 1)
          }
          if (retVal >= 1000) {
            return `${retVal / 1000} ${this.t.translate("Gbps")}`
          }
          return `${retVal} ${this.t.translate("Mbps")}`
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

  constructor(private t: I18nStore) {}
}
