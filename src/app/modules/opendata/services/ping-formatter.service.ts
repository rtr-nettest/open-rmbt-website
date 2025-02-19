import { I18nStore } from "../../i18n/store/i18n.store"
import { FormatterService } from "./formatter.service"

export class PingFormatterService extends FormatterService {
  override format(val: number, i18nStore: I18nStore) {
    if (val === null) {
      return ""
    } else {
      return val + " " + i18nStore.translate("millis")
    }
  }
}
