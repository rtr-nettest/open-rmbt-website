import { Pipe, PipeTransform } from "@angular/core"
import { I18nStore } from "../store/i18n.store"

@Pipe({
  name: "translate",
  standalone: true,
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  constructor(private readonly store: I18nStore) {}

  transform(key: string | null) {
    return key ? this.store.translations[key] || key : key
  }
}
