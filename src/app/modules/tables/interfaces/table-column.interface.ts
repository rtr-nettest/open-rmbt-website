import { Observable } from 'rxjs';
import { EFilterTypes } from '../constants/filter-types.enum';
import { ITableColumnAction } from './table-column-action.interface';
import { IDynamicComponent } from '../../shared/interfaces/dynamic-component.interface';
import { Type } from '@angular/core';

export interface ITableColumn<T = any> {
  component?: Type<IDynamicComponent<any>>;
  getComponentParameters?: (value: T) => { [key: string]: any };
  columnDef: string;
  getActions?: (
    value: T,
    column: ITableColumn<T>,
    ...args: any[]
  ) => ITableColumnAction<T>[];
  getNgClass?: (
    value: T,
    column: ITableColumn<T>,
    ...args: any[]
  ) => string | string[] | Set<string> | { [klass: string]: any };
  getTooltip?: (value: T, column: ITableColumn<T>, ...args: any[]) => string;
  footer?: string;
  header: string;
  isSortable?: boolean;
  isHtml?: boolean;
  isDate?: boolean;
  isExpandable?: boolean;
  justify?: 'flex-start' | 'center' | 'flex-end';
  key?: string;
  getLink?: (value: T, column: ITableColumn<T>, ...args: any[]) => string;
  linkDisabled?: (value: T) => boolean;
  subHeader?: string;
  transformValue?: (
    value: T,
    column: ITableColumn<T>,
    index?: number,
    ...args: any[]
  ) => any;
  width?: number | string;
  filterType?: EFilterTypes;
  getFilterOptions?: () => Observable<string[]>;
}
