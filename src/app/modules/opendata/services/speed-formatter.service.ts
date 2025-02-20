import { formatNumber } from "../../shared/util/math"
import { FormatterService } from "./formatter.service"

export class SpeedFormatterService extends FormatterService {
  override format(_: number, index: number) {
    const { min, max } = this
    let val: any = this.labels[index]
    if (val === null || val === undefined) {
      return ""
    }
    val = parseFloat(val)
    let nr: string
    //calculate how many positions are needed
    const step = (max - min) / 1000 / 12
    const positions = Math.ceil(Math.abs(Math.log(step) / Math.LN10))

    //if at least 1 mbit difference -> use two significant digits
    if (step > 1) {
      if (val < 1000) nr = formatNumber(val / 1000, 2)
      else if (val < 10000) nr = formatNumber(val / 1000, 1)
      else nr = formatNumber(val / 1000, 0)
      return nr + " " + this.i18nStore.translate("Mbps")
    } else {
      nr = formatNumber(val, positions)
      return nr + " " + this.i18nStore.translate("kbps")
    }
  }
}
