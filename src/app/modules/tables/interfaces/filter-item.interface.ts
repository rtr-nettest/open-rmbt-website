import { Observable } from 'rxjs';
import { EFilterModifier } from '../constants/filter-modifier.enum';
import { EFilterTypes } from '../constants/filter-types.enum';

export interface IFilterItem {
  action: () => void;
  isRemovable: boolean;
  label: string;
  key: string;
  value?: string;
  queryModifier?: EFilterModifier;
  filterType?: EFilterTypes;
  getOptions?: () => Observable<string[]>;
}
