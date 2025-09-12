import { environment } from "../../../../environments/environment"
import { ILocale } from "../interfaces/locale.interface"
import defTranslations from "../../../../assets/i18n/en.json"

export class TranslationHttpLoader {
  static async getLocales() {
    let availableLocales: ILocale[] = [
      {
        code: "en",
        name: "English",
      },
    ]
    try {
      availableLocales = await (
        await fetch(`${environment.baseUrl}/assets/available-locales.json`)
      ).json()
    } catch (e) {
      console.warn(e)
    }
    return availableLocales
  }

  static async getTranslations(lang: string): Promise<{ [key: string]: any }> {
    try {
      const data = await Promise.all([
        fetch(`${environment.baseUrl}/assets/i18n/${lang}.json`).then((res) =>
          res.json()
        ),
        fetch(`${environment.baseUrl}/assets/i18n/countries/${lang}.json`).then(
          (res) => res.json()
        ),
      ])
      return { ...data[0], ...data[1] }
    } catch (e) {
      console.warn(e)
      return defTranslations
    }
  }

  static async getLocalizedHtml(name: string, lang: string) {
    try {
      const text = await (
        await fetch(
          `${environment.baseUrl}/assets/html/${name}/${name}.${lang}.html`
        )
      ).text()
      return text
    } catch (e) {
      console.warn(e)
      return ""
    }
  }
}
