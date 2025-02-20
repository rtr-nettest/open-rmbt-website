import { FormatterService } from "./formatter.service"

export class PingFormatterService extends FormatterService {
  override format(val: number) {
    if (val === null) {
      return ""
    } else {
      return this.labels[val] + " " + this.i18nStore.translate("millis")
    }
  }
}
