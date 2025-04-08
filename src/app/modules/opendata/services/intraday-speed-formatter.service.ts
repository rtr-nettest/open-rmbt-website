import { formatNumber } from "../../shared/util/math"
import { FormatterService } from "./formatter.service"

export class IntradaySpeedFormatterService extends FormatterService {
  override format(value: number, _: number) {
    const v = value / 1000
    if (v > 4) {
      return formatNumber(v, 0) + " " + this.i18nStore.translate("Mbps")
    } else {
      return formatNumber(v, 1) + " " + this.i18nStore.translate("Mbps")
    }
  }
}
