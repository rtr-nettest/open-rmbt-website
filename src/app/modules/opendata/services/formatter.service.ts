import { I18nStore } from "../../i18n/store/i18n.store"

export abstract class FormatterService {
  constructor(
    protected i18nStore: I18nStore,
    protected labels: string[],
    protected min: number = -Infinity,
    protected max: number = Infinity
  ) {}

  format(val: number, index: number): string {
    throw new Error("Method not implemented.")
  }
}
