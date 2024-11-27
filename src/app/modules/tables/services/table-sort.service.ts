import { Injectable } from "@angular/core"
import { PageEvent } from "@angular/material/paginator"
import { Sort } from "@angular/material/sort"
import { FiltersStoreService } from "../store/filters-store.service"

@Injectable({
  providedIn: "root",
})
export class TableSortService {
  constructor(private readonly _filtersStore: FiltersStoreService) {}

  changeSort(newSort: Sort, action?: (...args: any) => any) {
    const parsed = new URLSearchParams(location.search)
    if (parsed.get("orderBy")) {
      parsed.delete("orderBy")
    }
    parsed.append("orderBy", `${newSort.active}:${newSort.direction}`)
    history.pushState(null, "", location.pathname + "?" + parsed.toString())
    action?.()
  }

  changePage(page: PageEvent, action?: (...args: any) => any) {
    const parsed = new URLSearchParams(location.search)
    if (parsed.get("offset")) {
      parsed.delete("offset")
    }
    parsed.append("offset", (page.pageIndex * page.pageSize).toString())
    if (parsed.get("limit")) {
      parsed.delete("limit")
    }
    parsed.append("limit", page.pageSize.toString())
    history.pushState(null, "", location.pathname + "?" + parsed.toString())
    action?.()
  }

  changeFilters(filter: URLSearchParams, action?: (...args: any) => any) {
    if (filter.get("offset")) {
      filter.set("offset", "0")
    }
    history.pushState(null, "", location.pathname + "?" + filter.toString())
    action?.()
    this._filtersStore.setFilters()
  }
}
