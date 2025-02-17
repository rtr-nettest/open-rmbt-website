import { Component, computed, input } from "@angular/core"
import { TableComponent } from "../../../tables/components/table/table.component"
import { IBasicResponse } from "../../../tables/interfaces/basic-response.interface"
import { ITableColumn } from "../../../tables/interfaces/table-column.interface"
import { ISort } from "../../../tables/interfaces/sort.interface"
import { I18nStore } from "../../../i18n/store/i18n.store"
import { ExpansionPanelComponent } from "../expansion-panel/expansion-panel.component"

export const imports = [ExpansionPanelComponent, TableComponent]

@Component({
  selector: "app-show-details",
  imports,
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

  constructor(protected readonly i18nStore: I18nStore) {}
}
