import { Component, inject, OnInit } from "@angular/core"
import {
  OPEN_DATA_LIMIT,
  OpendataStoreService,
} from "../../store/opendata-store.service"
import { OpendataService } from "../../services/opendata.service"
import { concatMap, firstValueFrom, map } from "rxjs"
import { toObservable } from "@angular/core/rxjs-interop"
import { FooterComponent } from "../../../shared/components/footer/footer.component"
import { HeaderComponent } from "../../../shared/components/header/header.component"
import { BreadcrumbsComponent } from "../../../shared/components/breadcrumbs/breadcrumbs.component"
import { TopNavComponent } from "../../../shared/components/top-nav/top-nav.component"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { AsyncPipe } from "@angular/common"
import { TableComponent } from "../../../tables/components/table/table.component"
import { ISort } from "../../../tables/interfaces/sort.interface"
import { LoadOnScrollComponent } from "../../../shared/components/load-on-scroll/load-on-scroll.component"
import { FiltersComponent } from "../../components/filters/filters.component"
import { LoadingOverlayComponent } from "../../../shared/components/loading-overlay/loading-overlay.component"

@Component({
    selector: "app-opendata-screen",
    imports: [
        AsyncPipe,
        BreadcrumbsComponent,
        HeaderComponent,
        FiltersComponent,
        FooterComponent,
        LoadingOverlayComponent,
        TableComponent,
        TopNavComponent,
        TranslatePipe,
    ],
    templateUrl: "./opendata-screen.component.html",
    styleUrl: "./opendata-screen.component.scss"
})
export class OpendataScreenComponent
  extends LoadOnScrollComponent
  implements OnInit
{
  opendataStoreService = inject(OpendataStoreService)
  opendataService = inject(OpendataService)
  columns = this.opendataService.getColumns()
  data$ = toObservable(this.opendataStoreService.data).pipe(
    map((data) => ({
      content: data,
      totalElements: data?.length,
    }))
  )
  filters$ = toObservable(this.opendataStoreService.filters).pipe(
    concatMap(() => this.updateData({ reset: true }))
  )
  sort: ISort = { active: "times", direction: "desc" }

  protected override get dataLimit(): number {
    return OPEN_DATA_LIMIT
  }

  protected override async fetchData(): Promise<Array<any>> {
    const filters = this.opendataStoreService.filters()
    const cursor = this.opendataStoreService.cursor()
    return firstValueFrom(this.opendataService.search({ ...filters, cursor }))
  }

  ngOnInit(): void {
    this.opendataService.initFilters()
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy()
    this.opendataStoreService.reset()
  }
}
