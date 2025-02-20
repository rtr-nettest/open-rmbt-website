import { FormatterService } from "./formatter.service"

export class PingFormatterService extends FormatterService {
  override format(_: number, index: number) {
    const val = this.labels[index]
    if (val === null || val === undefined) {
      return ""
    } else {
      return val + " " + this.i18nStore.translate("millis")
    }
  }
}
