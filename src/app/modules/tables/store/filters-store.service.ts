import { Injectable, signal } from '@angular/core';
import { IFilterItem } from '../interfaces/filter-item.interface';
import { ITableColumn } from '../interfaces/table-column.interface';
import { EFilterModifier } from '../constants/filter-modifier.enum';
import { EFilterTypes } from '../constants/filter-types.enum';

@Injectable({
  providedIn: 'root',
})
export class FiltersStoreService {
  columns = signal<ITableColumn[]>([]);
  filters = signal<IFilterItem[]>([]);

  constructor() {}

  setColumns(columns: ITableColumn[]) {
    this.columns.set(columns);
  }

  setFilters(searchParams?: URLSearchParams) {
    this.filters.set([]);
    const parsed = searchParams ?? new URLSearchParams(location.search);
    const filters: IFilterItem[] = [];
    for (const col of this.columns().filter((c) => !!c.filterType)) {
      const key = col.key || col.columnDef;
      const item: IFilterItem = {
        label: col.header,
        key,
        action: () => {},
        isRemovable: true,
        filterType: col.filterType,
        getOptions: col.getFilterOptions,
      };
      if (parsed.get(key)) {
        let value = parsed.get(key)!;
        if (value.startsWith(EFilterModifier.CONTAINING)) {
          item.value = value.replace(EFilterModifier.CONTAINING, '');
          item.queryModifier = EFilterModifier.CONTAINING;
        } else {
          item.value = value;
          item.queryModifier = EFilterModifier.EXACT;
        }
      }
      filters.push(item);
      this.filters.set(filters);
    }
  }
}
