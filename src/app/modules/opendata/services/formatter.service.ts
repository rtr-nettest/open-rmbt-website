import { I18nStore } from "../../i18n/store/i18n.store"

export abstract class FormatterService {
  constructor(
    protected min: number,
    protected max: number,
    protected labels: string[],
    protected i18nStore: I18nStore
  ) {}

  format(val: number, index: number): string {
    throw new Error("Method not implemented.")
  }
}
