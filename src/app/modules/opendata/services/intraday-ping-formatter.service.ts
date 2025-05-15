import { formatNumber } from "../../shared/util/math"
import { FormatterService } from "./formatter.service"

export class IntradayPingFormatterService extends FormatterService {
  override format(v: number, _: number) {
    return (
      formatNumber(v / 1e6, 0, this.i18nStore.activeLang) +
      " " +
      this.i18nStore.translate("millis")
    )
  }
}
