import { FormatterService } from "./formatter.service"

export class IntradaySpeedFormatterService extends FormatterService {
  override format(value: number, _: number) {
    const v = value / 1000
    if (v > 4) {
      return v.toFixed(0) + " " + this.i18nStore.translate("Mbps")
    } else {
      return v.toFixed(1) + " " + this.i18nStore.translate("Mbps")
    }
  }
}
