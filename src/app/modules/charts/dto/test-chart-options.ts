import { I18nStore } from "../../i18n/store/i18n.store"
import { EColors } from "../../shared/constants/colors.enum"

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
    decimation: {
      enabled: true,
      algorithm: "lttb",
      threshold: 2,
    },
  }
  scales: any
  spanGaps = true
  datasets = {
    line: {
      pointRadius: 0, // disable for all `'line'` datasets
    },
  }
  elements = {
    point: {
      radius: 0, // default to disabled in all datasets
    },
  }

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
        sampleSize: 1,
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
