import { ChangeDetectorRef, Component, inject } from "@angular/core"
import { SeoComponent } from "../../../shared/components/seo/seo.component"
import { UUID } from "../../../test/constants/strings"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { HeaderComponent } from "../../../shared/components/header/header.component"
import { TopNavComponent } from "../../../shared/components/top-nav/top-nav.component"
import { BreadcrumbsComponent } from "../../../shared/components/breadcrumbs/breadcrumbs.component"
import { ScrollTopComponent } from "../../../shared/components/scroll-top/scroll-top.component"
import { FooterComponent } from "../../../shared/components/footer/footer.component"
import { IMainMenuItem } from "../../../shared/interfaces/main-menu-item.interface"
import { HISTORY_LIMIT, HistoryStore } from "../../store/history.store"
import { HistoryExportService } from "../../services/history-export.service"
import { ActionButtonsComponent } from "../../components/action-buttons/action-buttons.component"
import { RecentHistoryComponent } from "../../components/recent-history/recent-history.component"
import { AsyncPipe } from "@angular/common"
import { Observable } from "rxjs"
import { IBasicResponse } from "../../../tables/interfaces/basic-response.interface"
import { HistoryService } from "../../services/history.service"
import { ISort } from "../../../tables/interfaces/sort.interface"
import { ISimpleHistoryResult } from "../../interfaces/simple-history-result.interface"

@Component({
  selector: "app-history-screen",
  standalone: true,
  imports: [
    ActionButtonsComponent,
    AsyncPipe,
    BreadcrumbsComponent,
    FooterComponent,
    HeaderComponent,
    RecentHistoryComponent,
    ScrollTopComponent,
    TopNavComponent,
    TranslatePipe,
  ],
  templateUrl: "./history-screen.component.html",
  styleUrl: "./history-screen.component.scss",
})
export class HistoryScreenComponent extends SeoComponent {
  cdr = inject(ChangeDetectorRef)
  exporter = inject(HistoryExportService)
  service = inject(HistoryService)
  store = inject(HistoryStore)

  allLoaded = false
  actionButtons: IMainMenuItem[] = [
    {
      label: "Export as CSV",
      icon: "filetype-csv",
      action: () => this.exporter.exportAs("csv", this.store.history$.value),
    },
    {
      label: "Export as PDF",
      icon: "filetype-pdf",
      action: () => this.exporter.exportAsPdf(this.store.history$.value),
    },
    {
      label: "Export as XLSX",
      icon: "filetype-xlsx",
      action: () => this.exporter.exportAs("xlsx", this.store.history$.value),
    },
  ]
  loading = false
  shouldGroupHistory = true
  result$: Observable<IBasicResponse<ISimpleHistoryResult>> =
    this.service.getHistoryGroupedByLoop({ grouped: this.shouldGroupHistory })

  get uuid() {
    if (!globalThis.localStorage) {
      return null
    }
    return localStorage.getItem(UUID)
  }

  ngAfterViewChecked(): void {
    this.cdr.detectChanges()
  }

  ngOnInit(): void {
    this.allLoaded = false
    this.loadMore()
  }

  changeSort = (sort: ISort) => {
    this.allLoaded = false
    this.service.sortMeasurementHistory(sort, this.loadMore.bind(this))
  }

  async loadMore() {
    if (this.loading || this.allLoaded || !this.uuid) {
      return
    }
    this.loading = true
    try {
      const history = await this.service.getMeasurementHistory(
        this.store.paginator()
      )
      if (!history || !history.length || history.length < HISTORY_LIMIT) {
        this.allLoaded = true
      } else {
        this.store.paginator.set({
          offset: this.store.paginator().offset + HISTORY_LIMIT,
          limit: HISTORY_LIMIT,
        })
      }
    } finally {
      this.loading = false
    }
  }
}
