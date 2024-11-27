import { ITableColumn } from './table-column.interface';

export interface ITableColumnAction<T> {
  color?: string;
  label: string;
  matIcon?: string;
  style?: string;
  perform: (value: T, column: ITableColumn<T>, ...args: any[]) => void;
  getNgClass?: (
    value: T,
    column: ITableColumn<T>,
    ...args: any[]
  ) => string | string[] | Set<string> | { [klass: string]: any };
  getDisabled?: (value: T, column: ITableColumn<T>, ...args: any[]) => boolean;
  getInProgress?: (
    value: T,
    column: ITableColumn<T>,
    ...args: any[]
  ) => boolean;
  getTooltip?: (value: T, column: ITableColumn<T>, ...args: any[]) => string;
  type?: 'text' | 'icon';
}
