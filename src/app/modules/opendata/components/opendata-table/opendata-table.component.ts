import { ChangeDetectionStrategy, Component } from "@angular/core"
import { TableComponent } from "../../../tables/components/table/table.component"
import { arrowRotate } from "../../../shared/animations/arrow-rotate.animation"
import { expandVertically } from "../../../shared/animations/detail-expand.animation"
import { DynamicComponentDirective } from "../../../shared/directives/dynamic-component.directive"
import { NgClass, NgFor, NgIf } from "@angular/common"
import { MatButtonModule } from "@angular/material/button"
import { MatTableModule } from "@angular/material/table"
import { MatTooltipModule } from "@angular/material/tooltip"
import { MatSortModule } from "@angular/material/sort"
import { MatIconModule } from "@angular/material/icon"
import { MatProgressSpinner } from "@angular/material/progress-spinner"
import { PaginatorComponent } from "../../../tables/components/paginator/paginator.component"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"

@Component({
  selector: "app-opendata-table",
  animations: [arrowRotate, expandVertically],
  imports: [
    NgFor,
    NgIf,
    NgClass,
    MatButtonModule,
    MatTableModule,
    MatTooltipModule,
    MatSortModule,
    MatIconModule,
    TranslatePipe,
  ],
  templateUrl: "./opendata-table.component.html",
  styleUrl: "./opendata-table.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpendataTableComponent extends TableComponent {
  override ngOnChanges(): void {
    // do nothing
  }

  override ngOnInit() {
    for (let i = 0; i < this.columns.length; i++) {
      this.displayedColumns.push(this.columns[i].columnDef)
    }
  }
}
