import { I18nStore } from "../../i18n/store/i18n.store"
import { EColors } from "../constants/colors.enum"

export class TestChartOptions {
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
  plugins = {
    legend: {
      display: false,
    },
    tooltip: {
      enabled: false,
    },
  }
  scales: any

  constructor(private t: I18nStore) {
    this.scales = {
      x: {
        grid: {
          display: false,
        },
        title: {
          display: true,
          color: EColors.SECONDARY_50,
          font: {
            size: 12,
          },
        },
        ticks: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
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
          labelString: this.t.translate("Mbps"),
        },
        position: "right",
        ticks: {
          color: EColors.SECONDARY_50,
          font: {
            size: 12,
          },
          maxTicksLimit: 6,
          stepSize: 1,
        },
      },
    }
  }
}
