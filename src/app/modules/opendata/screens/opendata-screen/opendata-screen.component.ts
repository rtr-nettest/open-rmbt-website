import { Component, effect, inject, OnInit } from "@angular/core"
import { OpendataStoreService } from "../../store/opendata-store.service"
import { OpendataService } from "../../services/opendata.service"
import { SeoComponent } from "../../../shared/components/seo/seo.component"
import { concat, concatMap, from, map } from "rxjs"
import { toObservable } from "@angular/core/rxjs-interop"
import { filtersFromSearch } from "../../../shared/util/search"
import { FooterComponent } from "../../../shared/components/footer/footer.component"
import { HeaderComponent } from "../../../shared/components/header/header.component"
import { BreadcrumbsComponent } from "../../../shared/components/breadcrumbs/breadcrumbs.component"
import { TopNavComponent } from "../../../shared/components/top-nav/top-nav.component"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { AsyncPipe } from "@angular/common"
import { TableComponent } from "../../../tables/components/table/table.component"
import { ISort } from "../../../tables/interfaces/sort.interface"

@Component({
  selector: "app-opendata-screen",
  standalone: true,
  imports: [
    AsyncPipe,
    BreadcrumbsComponent,
    HeaderComponent,
    FooterComponent,
    TableComponent,
    TopNavComponent,
    TranslatePipe,
  ],
  templateUrl: "./opendata-screen.component.html",
  styleUrl: "./opendata-screen.component.scss",
})
export class OpendataScreenComponent extends SeoComponent implements OnInit {
  opendataStoreService = inject(OpendataStoreService)
  opendataService = inject(OpendataService)
  columns = this.opendataService.getColumns()
  data$ = toObservable(this.opendataStoreService.filters).pipe(
    concatMap((filters) => this.opendataService.search(filters)),
    map((response) => ({
      content: response.results,
      totalElements: response.results?.length || 0,
    }))
  )
  sort: ISort = { active: "times", direction: "desc" }

  ngOnInit(): void {
    if (!globalThis?.location) return
    const search = location.search.slice(1)
    if (search) this.opendataStoreService.filters.set(filtersFromSearch(search))
  }
}
