import { Component, inject } from "@angular/core"
import { SeoComponent } from "../../../shared/components/seo/seo.component"
import { StatisticsService } from "../../services/statistics.service"
import { AsyncPipe } from "@angular/common"
import { StatisticsStoreService } from "../../store/statistics-store.service"
import { switchMap } from "rxjs"
import { HeaderComponent } from "../../../shared/components/header/header.component"
import { TopNavComponent } from "../../../shared/components/top-nav/top-nav.component"
import { FooterComponent } from "../../../shared/components/footer/footer.component"
import { BreadcrumbsComponent } from "../../../shared/components/breadcrumbs/breadcrumbs.component"

@Component({
  selector: "app-statistics-screen",
  standalone: true,
  imports: [
    BreadcrumbsComponent,
    HeaderComponent,
    TopNavComponent,
    FooterComponent,
    AsyncPipe,
  ],
  templateUrl: "./statistics-screen.component.html",
  styleUrl: "./statistics-screen.component.scss",
})
export class StatisticsScreenComponent extends SeoComponent {
  service = inject(StatisticsService)
  store = inject(StatisticsStoreService)
  statistics$ = this.store.filters$.pipe(
    switchMap((filters) => this.service.getStatistics(filters))
  )
}
