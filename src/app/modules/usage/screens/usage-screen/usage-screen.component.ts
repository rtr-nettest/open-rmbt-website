import { Component, computed, inject, OnInit, signal } from "@angular/core"
import { MatSelectModule } from "@angular/material/select"
import { FormsModule } from "@angular/forms"
import { SeoComponent } from "../../../shared/components/seo/seo.component"
import { HeaderComponent } from "../../../shared/components/header/header.component"
import { TopNavComponent } from "../../../shared/components/top-nav/top-nav.component"
import { FooterComponent } from "../../../shared/components/footer/footer.component"
import { BreadcrumbsComponent } from "../../../shared/components/breadcrumbs/breadcrumbs.component"
import { MainContentComponent } from "../../../shared/components/main-content/main-content.component"
import { LoadingOverlayComponent } from "../../../shared/components/loading-overlay/loading-overlay.component"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { UsageSectionComponent } from "../../components/usage-section/usage-section.component"
import { UsageService } from "../../services/usage.service"
import { IUsageReport, TUsageStatistic } from "../../interfaces/usage.interface"

interface ISectionConfig {
  key: TUsageStatistic
  title: string
  chartKind: "bar" | "line"
  stacked: boolean
  showShare: boolean
  fields?: string[]
  kpiFields?: string[]
  labelMap?: Record<string, string>
}

const USAGE_LABELS: Record<string, string> = {
  tests: "Tests total",
  finished: "Successful",
  aborted: "Aborted",
  clients: "Distinct clients",
  ips: "Distinct IPs",
}

@Component({
  selector: "app-usage-screen",
  imports: [
    FormsModule,
    MatSelectModule,
    BreadcrumbsComponent,
    HeaderComponent,
    TopNavComponent,
    FooterComponent,
    MainContentComponent,
    LoadingOverlayComponent,
    UsageSectionComponent,
    TranslatePipe,
  ],
  templateUrl: "./usage-screen.component.html",
  styleUrl: "./usage-screen.component.scss",
})
export class UsageScreenComponent extends SeoComponent implements OnInit {
  private readonly service = inject(UsageService)

  loading = signal(false)
  report = signal<IUsageReport | undefined>(undefined)

  private now = new Date()
  year = signal(this.now.getFullYear())
  month = signal(this.now.getMonth()) // zero-based, matches the API

  years = Array.from(
    { length: this.now.getFullYear() - 2012 + 1 },
    (_, i) => 2012 + i
  ).reverse()

  months = computed(() => {
    const lang = this.i18nStore.activeLang
    return Array.from({ length: 12 }, (_, i) => ({
      value: i,
      label: new Date(2000, i, 1).toLocaleDateString(lang, { month: "long" }),
    }))
  })

  sections: ISectionConfig[] = [
    {
      key: "usage",
      title: "Usage",
      chartKind: "line",
      stacked: false,
      showShare: false,
      fields: ["tests", "finished", "aborted", "clients"],
      kpiFields: ["tests", "finished", "aborted", "clients"],
      labelMap: USAGE_LABELS,
    },
    { key: "platforms", title: "Platforms", chartKind: "bar", stacked: true, showShare: true },
    { key: "platforms_loopmode", title: "Platforms (loop mode)", chartKind: "bar", stacked: true, showShare: true },
    { key: "platforms_qos", title: "Platforms (QoS)", chartKind: "bar", stacked: true, showShare: true },
    { key: "network_group_names", title: "Network type", chartKind: "bar", stacked: true, showShare: true },
    { key: "network_group_types", title: "Network technology", chartKind: "bar", stacked: true, showShare: true },
    { key: "versions_ios", title: "Versions iOS", chartKind: "bar", stacked: true, showShare: true },
    { key: "versions_android", title: "Versions Android", chartKind: "bar", stacked: true, showShare: true },
    { key: "versions_applet", title: "Versions Applet", chartKind: "bar", stacked: true, showShare: true },
  ]

  ngOnInit(): void {
    this.load()
  }

  onYearChange(year: number) {
    this.year.set(year)
    this.load()
  }

  onMonthChange(month: number) {
    this.month.set(month)
    this.load()
  }

  sectionData(key: TUsageStatistic) {
    return this.report()?.[key]
  }

  private load() {
    this.loading.set(true)
    this.service.getUsage(this.year(), this.month()).subscribe({
      next: (report) => {
        this.report.set(report)
        this.loading.set(false)
      },
      error: () => {
        this.report.set({})
        this.loading.set(false)
      },
    })
  }
}
