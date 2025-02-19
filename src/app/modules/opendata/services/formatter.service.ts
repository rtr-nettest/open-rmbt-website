import { I18nStore } from "../../i18n/store/i18n.store"

export abstract class FormatterService {
  constructor(protected min: number, protected max: number) {}

  format(val: number, i18nStore: I18nStore): string {
    throw new Error("Method not implemented.")
  }
}
