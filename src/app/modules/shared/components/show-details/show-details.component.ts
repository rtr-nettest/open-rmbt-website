import { Component, computed, input, signal } from "@angular/core"
import { TableComponent } from "../../../tables/components/table/table.component"
import { MatExpansionModule } from "@angular/material/expansion"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { IBasicResponse } from "../../../tables/interfaces/basic-response.interface"
import { ITableColumn } from "../../../tables/interfaces/table-column.interface"
import { ISort } from "../../../tables/interfaces/sort.interface"

@Component({
  selector: "app-show-details",
  standalone: true,
  imports: [TableComponent, MatExpansionModule, TranslatePipe],
  templateUrl: "./show-details.component.html",
  styleUrl: "./show-details.component.scss",
})
export class ShowDetailsComponent<T> {
  details = input<T[]>([])
  data = computed<IBasicResponse<T>>(() => {
    const content = this.details()
    return {
      content,
      totalElements: content.length,
    }
  })
  columns: ITableColumn<T>[] = []
  sort: ISort = {
    direction: "asc",
    active: "",
  }
}
