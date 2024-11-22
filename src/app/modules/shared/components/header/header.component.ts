import { Component } from "@angular/core"
import { I18nStore } from "../../../i18n/store/i18n.store"
import { MatIconModule } from "@angular/material/icon"
import { MatButtonModule } from "@angular/material/button"
import { MatMenuModule } from "@angular/material/menu"
import { ILocale } from "../../../i18n/interfaces/locale.interface"
import { firstValueFrom, map, Observable } from "rxjs"
import { Router } from "@angular/router"
import { ILink } from "../../interfaces/link.interface"
import { AsyncPipe } from "@angular/common"

@Component({
  selector: "app-header",
  standalone: true,
  imports: [AsyncPipe, MatIconModule, MatButtonModule, MatMenuModule],
  templateUrl: "./header.component.html",
  styleUrl: "./header.component.scss",
})
export class HeaderComponent {
  rtrOpen = false
  langOpen = false
  rtrLinks$!: Observable<ILink[]>

  get activeLang() {
    return this.i18nStore.activeLang
  }

  get availableLocales() {
    return this.i18nStore.availableLocales
  }

  constructor(
    private readonly i18nStore: I18nStore,
    private readonly router: Router
  ) {
    this.rtrLinks$ = this.i18nStore.getTranslations().pipe(
      map((v) => [
        {
          label: v["Telecommunications and Postal Division"],
          url: v[
            "https://www.rtr.at/TKP/Telecommunications_and_Postal_Division.en.html"
          ],
        },
        {
          label: v["Media"],
          url: v["https://www.rtr.at/medien/startseite_medien.de.html"],
        },
        {
          label: v["RTR"],
          url: v["https://www.rtr.at/rtr/startseite.de.html"],
        },
      ])
    )
  }

  setLocale(locale: ILocale) {
    const paths = globalThis.location.pathname.split("/").filter(Boolean)
    if (paths.length == 0 || this.i18nStore.availableLangs.includes(paths[0])) {
      paths[0] = locale.code
    } else {
      paths.unshift(locale.code)
    }

    this.router.navigate(paths)
  }
}
