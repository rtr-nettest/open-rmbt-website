import { Component } from "@angular/core"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { AsyncPipe, UpperCasePipe } from "@angular/common"
import { map, Observable } from "rxjs"
import { ILink } from "../../interfaces/link.interface"
import { I18nStore } from "../../../i18n/store/i18n.store"
import { TelPipe } from "../../pipes/tel.pipe"
import { MatButtonModule } from "@angular/material/button"
import { ERoutes } from "../../constants/routes.enum"
import { RouterModule } from "@angular/router"

@Component({
  selector: "app-footer",
  imports: [
    AsyncPipe,
    MatButtonModule,
    RouterModule,
    UpperCasePipe,
    TelPipe,
    TranslatePipe,
  ],
  templateUrl: "./footer.component.html",
  styleUrl: "./footer.component.scss",
})
export class FooterComponent {
  menu$!: Observable<ILink[]>

  constructor(private readonly i18nStore: I18nStore) {
    this.menu$ = this.i18nStore.getTranslations().pipe(
      map((v) => [
        {
          label: "Publishing information",
          url: "https://www.rtr.at/rtr/footer/impressum.en.html",
        },
        {
          label: "Privacy",
          url: "https://www.netztest.at/redirect/en/terms",
        },
        {
          label: "Accessibility",
          url: "https://www.rtr.at/rtr/footer/Barrierefreiheit.en.html",
        },
        {
          label: "Sitemap",
          route: `/${this.i18nStore.activeLang}/${ERoutes.SITEMAP}`,
        },
      ])
    )
  }
}
