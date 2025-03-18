import { Platform } from "@angular/cdk/platform"
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
  NativeDateAdapter,
} from "@angular/material/core"
import dayjs from "dayjs"
import { IRecentMeasurement } from "../../opendata/interfaces/recent-measurements-response.interface"

export const APP_DATE_FORMAT = "YYYY-MM-DD"
export const APP_DATE_TIME_FORMAT = "YYYY-MM-DD HH:mm"
export const APP_TIME_FORMAT = "HH:mm"

export const AppDateFormats = {
  parse: {
    dateInput: APP_DATE_FORMAT,
    timeInput: APP_TIME_FORMAT,
  },
  display: {
    dateInput: APP_DATE_FORMAT,
    timeInput: APP_TIME_FORMAT,
    timeOptionLabel: APP_TIME_FORMAT,
    monthYearLabel: "MMM YYYY",
    dateA11yLabel: "LL",
    monthYearA11yLabel: "MMMM YYYY",
  },
}

export class AppDateAdapter extends NativeDateAdapter {
  override format(date: Date, format: string): string {
    return dayjs(date).format(format)
  }

  override parse(value: any, format: string): Date | null {
    return dayjs(value, format).toDate()
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
  ]
}

export function formatTime(value: IRecentMeasurement) {
  value.time = dayjs(value.time)
    .utc(true)
    .tz(dayjs.tz.guess())
    .format(APP_DATE_TIME_FORMAT)
  return value
}
