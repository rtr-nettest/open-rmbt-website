import { Platform } from '@angular/cdk/platform';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
  NativeDateAdapter,
} from '@angular/material/core';
import dayjs from 'dayjs';

export const APP_DATE_FORMAT = 'DD.MM.YYYY';
export const APP_DATE_TIME_FORMAT = 'DD.MM.YYYY HH:mm';

export const AppDateFormats = {
  parse: {
    dateInput: 'DD.MM.YYYY',
  },
  display: {
    dateInput: 'DD.MM.YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

export class AppDateAdapter extends NativeDateAdapter {
  override format(date: Date) {
    return dayjs(date).format(APP_DATE_FORMAT);
  }

  override parse(value: any): Date | null {
    const [d, m, y] = value?.split('.').map((t: string) => parseInt(t, 10));
    const parsed = dayjs()
      .set('year', y)
      .set('month', m - 1)
      .set('date', d);
    return parsed.toDate();
  }
}

export function provideAppDateAdapter() {
  return [
    {
      provide: DateAdapter,
      useClass: AppDateAdapter,
      deps: [MAT_DATE_LOCALE, Platform],
    },
    {
      provide: MAT_DATE_FORMATS,
      useValue: AppDateFormats,
    },
  ];
}
