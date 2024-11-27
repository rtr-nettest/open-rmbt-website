import { Pipe, PipeTransform } from "@angular/core"
import { I18nStore } from "../store/i18n.store"

@Pipe({
  name: "translate",
  standalone: true,
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  constructor(private readonly store: I18nStore) {}

  transform(key: string | null, args?: { [key: string]: any }) {
    if (!key) {
      return ""
    }
    let retVal = this.store.translations[key] || key
    if (args) {
      for (const [key, val] of Object.entries(args)) {
        retVal = retVal.replace(`%${key}`, val)
      }
    }
    return retVal
  }
}
