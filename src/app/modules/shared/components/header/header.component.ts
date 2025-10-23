import { Component, HostListener } from "@angular/core"
import { I18nStore } from "../../../i18n/store/i18n.store"
import { MatIconModule } from "@angular/material/icon"
import { MatButtonModule } from "@angular/material/button"
import { MatMenuModule } from "@angular/material/menu"
import { ILocale } from "../../../i18n/interfaces/locale.interface"
import { map, Observable } from "rxjs"
import { ILink } from "../../interfaces/link.interface"
import { AsyncPipe } from "@angular/common"
import { TranslationService } from "../../../i18n/services/translation.service"
import { expandVertically } from "../../animations/detail-expand.animation"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"

@Component({
  selector: "app-header",
  animations: [expandVertically],
  imports: [
    AsyncPipe,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    TranslatePipe,
  ],
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
    private readonly translation: TranslationService
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
    this.translation.setLocale(locale)
  }

  toggleSubmenu(event: Event, type: "rtr" | "lang" = "rtr") {
    event.stopPropagation()
    if (type === "rtr") {
      this.rtrOpen = !this.rtrOpen
      this.langOpen = false
    } else {
      this.langOpen = !this.langOpen
      this.rtrOpen = false
    }
  }

  @HostListener("document:click")
  hideSubmenu() {
    if (this.rtrOpen) {
      document.getElementById("rtrSubmenuTrigger")?.focus()
      this.rtrOpen = false
    }
    if (this.langOpen) {
      document.getElementById("langSubmenuTrigger")?.focus()
      this.langOpen = false
    }
  }

  @HostListener("document:keydown.escape", ["$event"])
  handleEscapeKey(event: KeyboardEvent) {
    if (this.rtrOpen || this.langOpen) {
      event.preventDefault()
      this.hideSubmenu()
    }
  }
}
