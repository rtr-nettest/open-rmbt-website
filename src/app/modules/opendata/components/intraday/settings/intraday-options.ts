import { EColors } from "../../../../shared/constants/colors.enum"
import { I18nStore } from "../../../../i18n/store/i18n.store"
import { FormatterService } from "../../../services/formatter.service"
import { formatNumber } from "../../../../shared/util/math"
import dayjs from "dayjs"
import { min } from "rxjs"

export class IntradayOptions {
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
      display: false,
    },
    x1: {
      type: "linear" as const,
      min: 0,
      max: 24,
      ticks: {
        color: EColors.SECONDARY_50,
        stepSize: 2.5,
        font: {
          size: 12,
        },
        callback: (value: any) => {
          if (value === 24) {
            return ""
          }
          return dayjs()
            .hour(Math.floor(value))
            .minute((value % 1) * 60)
            .format("H:mm")
        },
      },
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
        count: 6,
        callback: (v: any, i: number) => {
          return this.formatter.format(v, i)
        },
      },
    },
    y1: {
      beginAtZero: true,
      grid: {
        color: EColors.SECONDARY_10,
      },
      min: 0,
      max: 3 * 1e6,
      position: "right",
      ticks: {
        stepSize: 5 * 1e5,
        color: EColors.SECONDARY_50,
        font: {
          size: 12,
        },
        callback: (v: any) => {
          if (v > 1000000) {
            return (
              formatNumber(v / 1000000, 1, this.t.activeLang) +
              " " +
              this.t.translate("Mio_abbr")
            )
          } else if (v > 1000) {
            if (v > 10000) {
              return (
                formatNumber(v / 1000, 0, this.t.activeLang) +
                " " +
                this.t.translate("Thou_abbr")
              )
            } else {
              return (
                formatNumber(v / 1000, 1, this.t.activeLang) +
                " " +
                this.t.translate("Thou_abbr")
              )
            }
          }
          return v
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

  constructor(private t: I18nStore, private formatter: FormatterService) {}
}
