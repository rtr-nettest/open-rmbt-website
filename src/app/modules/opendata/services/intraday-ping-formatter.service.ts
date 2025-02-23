import { FormatterService } from "./formatter.service"

export class IntradayPingFormatterService extends FormatterService {
  override format(v: number, _: number) {
    return v / 1e6 + " " + this.i18nStore.translate("millis")
  }
}
