import { Component, inject } from "@angular/core"
import { SeoComponent } from "../../../shared/components/seo/seo.component"
import { StatisticsService } from "../../services/statistics.service"
import { AsyncPipe } from "@angular/common"
import { StatisticsStoreService } from "../../store/statistics-store.service"
import { catchError, Observable, switchMap, tap } from "rxjs"
import { HeaderComponent } from "../../../shared/components/header/header.component"
import { TopNavComponent } from "../../../shared/components/top-nav/top-nav.component"
import { FooterComponent } from "../../../shared/components/footer/footer.component"
import { BreadcrumbsComponent } from "../../../shared/components/breadcrumbs/breadcrumbs.component"
import { FiltersComponent } from "../../components/filters/filters.component"
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner"
import { HtmlWrapperComponent } from "../../../shared/components/html-wrapper/html-wrapper.component"

@Component({
  selector: "app-statistics-screen",
  standalone: true,
  imports: [
    BreadcrumbsComponent,
    FiltersComponent,
    HeaderComponent,
    HtmlWrapperComponent,
    TopNavComponent,
    FooterComponent,
    MatProgressSpinnerModule,
    AsyncPipe,
  ],
  templateUrl: "./statistics-screen.component.html",
  styleUrl: "./statistics-screen.component.scss",
})
export class StatisticsScreenComponent extends SeoComponent {
  loading = false
  progress = 0
  progressInterval?: NodeJS.Timeout
  service = inject(StatisticsService)
  store = inject(StatisticsStoreService)
  statistics$ = this.store.filters$.pipe(
    switchMap((filters) => {
      this.loading = true
      if (globalThis.document) {
        this.progressInterval = setInterval(() => {
          this.progress += 0.02
        }, 100)
      }
      return this.service.getStatistics(filters)
    }),
    tap(() => {
      this.loading = false
      this.progress = 0
      clearInterval(this.progressInterval)
      this.progressInterval = undefined
    }),
    catchError(() => {
      this.loading = false
      return []
    })
  )
  statisticsText$: Observable<string> =
    this.i18nStore.getLocalizedHtml("statistics")
}
