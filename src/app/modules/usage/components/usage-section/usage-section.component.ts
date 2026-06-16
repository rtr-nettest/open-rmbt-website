import {
  afterRenderEffect,
  Component,
  computed,
  inject,
  input,
  OnDestroy,
} from "@angular/core"
import { Chart, ChartDataset, Legend, Tooltip } from "chart.js"
import dayjs from "dayjs"
import { I18nStore } from "../../../i18n/store/i18n.store"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { TableComponent } from "../../../tables/components/table/table.component"
import { ITableColumn } from "../../../tables/interfaces/table-column.interface"
import { ISort } from "../../../tables/interfaces/sort.interface"
import { IUsageSection } from "../../interfaces/usage.interface"

const TOP_N = 12
const OTHER = "Other"

// distinct, accessible palette reused across the categorical charts
const PALETTE = [
  "#2f5f00",
  "#0071d7",
  "#e8a33d",
  "#c0182d",
  "#6a3d9a",
  "#1f9e89",
  "#d94f70",
  "#8d6e63",
  "#b58900",
  "#16a085",
  "#9b59b6",
  "#34495e",
]
const OTHER_COLOR = "#9e9e9e"
// semantic colors for the classic usage metrics
const SEMANTIC_COLORS: Record<string, string> = {
  tests: "#0071d7",
  finished: "#2f8a00",
  aborted: "#c0182d",
  clients: "#6a3d9a",
  ips: "#9e9e9e",
}

interface ITableRow {
  field: string
  label: string
  count: number
  share: number
}

@Component({
  selector: "app-usage-section",
  imports: [TableComponent, TranslatePipe],
  templateUrl: "./usage-section.component.html",
  styleUrl: "./usage-section.component.scss",
})
export class UsageSectionComponent implements OnDestroy {
  private readonly i18nStore = inject(I18nStore)

  id = input.required<string>()
  title = input.required<string>()
  data = input<IUsageSection | undefined>(undefined)
  chartKind = input<"bar" | "line">("bar")
  stacked = input<boolean>(true)
  showShare = input<boolean>(true)
  /** fixed field list (used by the classic usage section); otherwise top-N is derived */
  fields = input<string[] | null>(null)
  /** fields rendered as headline KPI cards */
  kpiFields = input<string[] | null>(null)
  /** maps raw field names to translation keys (used by the classic usage section) */
  labelMap = input<Record<string, string> | null>(null)

  private chart?: Chart

  vm = computed(() => this.buildViewModel())

  kpis = computed(() => {
    const fields = this.kpiFields()
    const section = this.data()
    if (!fields || !section) {
      return []
    }
    const sums = new Map(section.sums.map((s) => [s.field, s.sum]))
    return fields.map((field) => ({
      label: this.label(field),
      value: (sums.get(field) ?? 0).toLocaleString(this.i18nStore.activeLang),
    }))
  })

  columns = computed<ITableColumn<ITableRow>[]>(() => {
    const columns: ITableColumn<ITableRow>[] = [
      { header: "Name", columnDef: "label" },
      {
        header: "Quantity",
        columnDef: "count",
        transformValue: (row) =>
          row.count.toLocaleString(this.i18nStore.activeLang),
        justify: "flex-end",
      },
    ]
    if (this.showShare()) {
      columns.push({
        header: "Share of total",
        columnDef: "share",
        transformValue: (row) => `${row.share.toFixed(1)} %`,
        justify: "flex-end",
      })
    }
    return columns
  })

  tableData = computed(() => {
    const rows = this.vm()?.rows ?? []
    return { content: rows, totalElements: rows.length }
  })

  sort: ISort = { active: "count", direction: "desc" }

  constructor() {
    // runs after the DOM is updated, and re-runs whenever vm() changes, so the
    // <canvas> from the @if block is guaranteed to exist before we draw
    afterRenderEffect(() => {
      this.vm()
      this.renderChart()
    })
  }

  ngOnDestroy(): void {
    this.chart?.destroy()
  }

  private label(field: string) {
    const mapped = this.labelMap()?.[field]
    if (mapped) {
      return this.i18nStore.translate(mapped)
    }
    if (field === OTHER) {
      return this.i18nStore.translate(OTHER)
    }
    return this.i18nStore.translate(field)
  }

  private color(field: string, index: number) {
    return (
      SEMANTIC_COLORS[field] ??
      (field === OTHER ? OTHER_COLOR : PALETTE[index % PALETTE.length])
    )
  }

  private buildViewModel() {
    const section = this.data()
    if (!section || !section.values.length) {
      return null
    }

    // determine which fields to render as their own series
    const sortedSums = [...section.sums].sort((a, b) => b.sum - a.sum)
    const total = sortedSums.reduce((acc, s) => acc + s.sum, 0)
    const forced = this.fields()
    let mainFields: string[]
    if (forced) {
      mainFields = forced.filter((f) => sortedSums.some((s) => s.field === f))
    } else {
      mainFields = sortedSums.slice(0, TOP_N).map((s) => s.field)
    }
    const hasOther =
      !forced && sortedSums.length > mainFields.length && this.stacked()

    const days = [...section.values].sort((a, b) => a.day - b.day)
    const labels = days.map((d) => dayjs(d.day).format("D"))
    const dayMaps = days.map((d) => {
      const map = new Map<string, number>()
      for (const v of d.values) {
        map.set(v.field, v.value)
      }
      return map
    })

    const datasets: ChartDataset[] = mainFields.map((field, i) => {
      const color = this.color(field, i)
      return {
        label: this.label(field),
        data: dayMaps.map((m) => m.get(field) ?? 0),
        backgroundColor: color,
        borderColor: color,
        ...(this.chartKind() === "line"
          ? {
              fill: false,
              tension: 0.2,
              borderWidth: 1.5,
              pointRadius: 2.5,
              pointHoverRadius: 4,
              pointBackgroundColor: color,
            }
          : {}),
      }
    })

    if (hasOther) {
      datasets.push({
        label: this.label(OTHER),
        data: dayMaps.map((m) => {
          let sum = 0
          for (const [field, value] of m) {
            if (!mainFields.includes(field)) {
              sum += value
            }
          }
          return sum
        }),
        backgroundColor: OTHER_COLOR,
        borderColor: OTHER_COLOR,
      })
    }

    // table rows: every field from the sums, descending
    const rows: ITableRow[] = sortedSums.map((s) => ({
      field: s.field,
      label: this.label(s.field),
      count: s.sum,
      share: total ? (s.sum / total) * 100 : 0,
    }))

    return { labels, datasets, rows }
  }

  private renderChart() {
    if (!globalThis.document) {
      return
    }
    const vm = this.vm()
    const canvas = globalThis.document.getElementById(
      this.id()
    ) as HTMLCanvasElement
    if (!canvas) {
      return
    }
    this.chart?.destroy()
    if (!vm) {
      return
    }
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      return
    }
    const lang = this.i18nStore.activeLang
    this.chart = new Chart(ctx, {
      type: this.chartKind(),
      data: { labels: vm.labels, datasets: vm.datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        scales: {
          x: {
            stacked: this.stacked(),
            grid: { display: false },
          },
          y: {
            stacked: this.stacked(),
            beginAtZero: true,
            ticks: {
              callback: (value) => Number(value).toLocaleString(lang),
            },
          },
        },
        plugins: {
          legend: { display: true, position: "bottom" },
          tooltip: {
            callbacks: {
              label: (item) =>
                `${item.dataset.label}: ${Number(
                  item.parsed.y
                ).toLocaleString(lang)}`,
            },
          },
        },
      },
      plugins: [Legend, Tooltip],
    })
  }
}
