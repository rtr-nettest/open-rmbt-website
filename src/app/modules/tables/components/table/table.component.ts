import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  ViewChild,
} from "@angular/core"
import { MatSortModule, Sort } from "@angular/material/sort"
import { MatTable, MatTableModule } from "@angular/material/table"
import { PageEvent } from "@angular/material/paginator"
import { arrowRotate } from "../../../shared/animations/arrow-rotate.animation"
import { expandVertically } from "../../../shared/animations/detail-expand.animation"
import { ITableColumn } from "../../interfaces/table-column.interface"
import { IBasicResponse } from "../../interfaces/basic-response.interface"
import { IPaginator } from "../../interfaces/paginator.interface"
import { ISort } from "../../interfaces/sort.interface"
import { TableSortService } from "../../services/table-sort.service"
import dayjs from "dayjs"
import { RouterLink } from "@angular/router"
import { NgClass, NgFor, NgIf } from "@angular/common"
import { MatButtonModule } from "@angular/material/button"
import { MatTooltipModule } from "@angular/material/tooltip"
import { MatIconModule } from "@angular/material/icon"
import { MatProgressSpinner } from "@angular/material/progress-spinner"
import { PaginatorComponent } from "../paginator/paginator.component"
import { DynamicComponentDirective } from "../../../shared/directives/dynamic-component.directive"
import { I18nStore } from "../../../i18n/store/i18n.store"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { APP_DATE_TIME_FORMAT } from "../../../shared/adapters/app-date.adapter"

@Component({
  selector: "app-table",
  templateUrl: "./table.component.html",
  styleUrls: ["./table.component.scss"],
  animations: [arrowRotate, expandVertically],
  imports: [
    DynamicComponentDirective,
    NgFor,
    NgIf,
    NgClass,
    MatButtonModule,
    MatTableModule,
    MatTooltipModule,
    MatSortModule,
    MatIconModule,
    MatProgressSpinner,
    PaginatorComponent,
    TranslatePipe,
  ],
})
export class TableComponent implements OnInit, OnChanges {
  @Input() action?: (...ars: any[]) => any
  @Input() rowsAreCLickable = false
  @Input({ required: true }) columns: ITableColumn[] = []
  @Input({ required: true }) data?: IBasicResponse<any>
  @Input() expandableColumns: string[] = []
  @Input() expandedElements: (string | number)[] = []
  @Input() expandedTableClassNames: string[] = []
  @Input() identifyField?: string
  @Input() tableClassNames: string[] = []
  @Input() tableTranslatePrefix?: string
  @Input() paginator?: IPaginator
  @Input() shouldHideHeader: boolean = false
  @Input({ required: true }) sort?: ISort
  @Input() subHeaderColumns: ITableColumn[] = []
  @Input() footerColumns: string[] = []

  @Output() onRowClick = new EventEmitter<any>()

  @ViewChild(MatTable) table?: MatTable<any>

  AVAILABLE_SIZES = [10, 20, 50, 100]
  displayedColumns: string[] = []
  displayedSubHeaderColumns: string[] = []
  filters: ITableColumn[] = []

  get ngClass() {
    return this.tableClassNames?.length
      ? this.tableClassNames
      : "app-table--default"
  }

  constructor(
    private tableSortService: TableSortService,
    private i18nStore: I18nStore,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(): void {
    this.cdr.detectChanges()
    this.table?.removeFooterRowDef(null as any)
  }

  ngOnInit() {
    this.displayedColumns = this.columns
      ?.filter((c) => !c.isExpandable)
      .map((col) => col.columnDef)
    this.displayedSubHeaderColumns = this.subHeaderColumns?.map(
      (col) => col.columnDef
    )
    this.filters = this.columns?.filter((col) => !!col.filterType)
  }

  changeSort(newSort: Sort) {
    this.tableSortService.changeSort(newSort, this.action)
  }

  getDefaultValue(column: ITableColumn, element: any, i: number) {
    if (column.transformValue) {
      const transformed = column.transformValue(element, column, i)
      if (typeof transformed === "number") {
        return transformed.toLocaleString(this.i18nStore.activeLang)
      }
      return transformed
    }

    const value = element[column.key || column.columnDef]
    return this.toString(value, column)
  }

  toString(value: any, column: ITableColumn): string {
    const date = Date.parse(value)
    if (typeof value === "number") {
      return value.toLocaleString(this.i18nStore.activeLang)
    } else if (!isNaN(date) && column.isDate) {
      return dayjs(date).format(APP_DATE_TIME_FORMAT)
    }
    return value || "-"
  }

  changePage(pageEvent: PageEvent) {
    this.tableSortService.changePage(pageEvent, this.action)
  }

  changeFilters(key: string, value: string) {
    const params = new URLSearchParams(location.search)
    if (params.has(key)) {
      params.set(key, value)
    } else {
      params.append(key, value)
    }
    this.tableSortService.changeFilters(params, this.action)
  }

  shouldShowText(column: ITableColumn, element: any): boolean {
    const isLinkDisabled =
      column.getLink && column.linkDisabled && column.linkDisabled(element)
    return !column.getLink || !!isLinkDisabled
  }

  identify(index: number, item: any) {
    return item[this.identifyField || "id"]
  }

  isElementExpanded(elementId: number | string): boolean {
    return this.expandedElements.includes(elementId)
  }

  justify(column: ITableColumn) {
    const { justify } = column
    switch (justify) {
      case "center":
        return {
          justifyContent: justify,
          textAlign: justify,
        }
      case "flex-end":
        return {
          justifyContent: justify,
          textAlign: "right",
        }
      case "flex-start":
      default:
        return {
          justifyContent: "flex-start",
          textAlign: "left",
        }
    }
  }
}
