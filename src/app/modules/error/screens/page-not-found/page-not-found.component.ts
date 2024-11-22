import { Component } from "@angular/core"
import { I18nStore } from "../../../i18n/store/i18n.store"
import { MatButtonModule } from "@angular/material/button"
import { RouterModule } from "@angular/router"
import { ErrorStore } from "../../store/error-store.service"
import { SeoComponent } from "../../../shared/components/seo/seo.component"
import { Title } from "@angular/platform-browser"
import { BreadcrumbsComponent } from "../../../shared/components/breadcrumbs/breadcrumbs.component"

@Component({
  selector: "app-page-not-found",
  standalone: true,
  imports: [
    BreadcrumbsComponent,
    MatButtonModule,
    RouterModule,
    BreadcrumbsComponent,
  ],
  templateUrl: "./page-not-found.component.html",
  styleUrl: "./page-not-found.component.scss",
})
export class PageNotFoundComponent extends SeoComponent {
  link = "/"

  constructor(
    private readonly _i18n: I18nStore,
    private readonly _error: ErrorStore,
    private readonly _ts: Title
  ) {
    super(_ts, _i18n)
    if (globalThis.location) {
      this.link = `/${this._i18n.activeLang}`
      if (this._error.$originalPath()) {
        history.replaceState("", "", this._error.$originalPath())
      }
    }
  }
}
