import { Component, inject } from "@angular/core"
import { I18nStore } from "../../../i18n/store/i18n.store"
import { MatButtonModule } from "@angular/material/button"
import { RouterModule } from "@angular/router"
import { ErrorStore } from "../../store/error-store.service"
import { SeoComponent } from "../../../shared/components/seo/seo.component"

@Component({
  selector: "app-page-not-found",
  imports: [MatButtonModule, RouterModule],
  templateUrl: "./page-not-found.component.html",
  styleUrl: "./page-not-found.component.scss",
})
export class PageNotFoundComponent extends SeoComponent {
  link = "/"

  private readonly error = inject(ErrorStore)

  constructor() {
    super()
    if (globalThis.location) {
      this.link = `/${this.i18nStore.activeLang}`
      if (this.error.$originalPath()) {
        history.replaceState("", "", this.error.$originalPath())
      }
    }
  }
}
