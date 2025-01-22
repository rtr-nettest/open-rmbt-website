import { Component, inject, OnInit } from "@angular/core"
import { Router } from "@angular/router"
import { Observable } from "rxjs"
import { ERoutes } from "../../../shared/constants/routes.enum"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { AsyncPipe } from "@angular/common"
import { IUserSetingsResponse } from "../../interfaces/user-settings-response.interface"
import { ScrollBottomComponent } from "../../../shared/components/scroll-bottom/scroll-bottom.component"
import { SeoComponent } from "../../../shared/components/seo/seo.component"
import { MatButtonModule } from "@angular/material/button"
import { TestService } from "../../services/test.service"
import { TC_VERSION_ACCEPTED } from "../../constants/strings"

@Component({
  selector: "app-terms-conditions-screen",
  templateUrl: "./terms-conditions-screen.component.html",
  styleUrls: ["./terms-conditions-screen.component.scss"],
  standalone: true,
  imports: [AsyncPipe, MatButtonModule, TranslatePipe, ScrollBottomComponent],
})
export class TermsConditionsScreenComponent
  extends SeoComponent
  implements OnInit
{
  terms$!: Observable<string>
  settings$!: Observable<IUserSetingsResponse>
  isRead = false
  router = inject(Router)
  service = inject(TestService)
  termsText = ""

  ngOnInit(): void {
    this.settings$ = this.service.getSettings()
    this.terms$ = this.i18nStore.getLocalizedHtml("terms-and-conditions")
    this.watchForScroll()
  }

  watchForScroll = () => {
    if (!globalThis.document) {
      return
    }
    const interval = setInterval(() => {
      const viewportHeight =
        document.querySelector(".app-wrapper")?.getBoundingClientRect()
          .height || 0
      const articleHeight =
        (document.querySelector(".app-article")?.getBoundingClientRect()
          .height || 0) - viewportHeight
      const articleY =
        document.querySelector(".app-article")?.getBoundingClientRect().y || 0
      if (Math.abs(articleY) > articleHeight) {
        this.isRead = true
        clearInterval(interval)
      }
    }, 300)
  }

  cancel() {
    this.router.navigate([this.i18nStore.activeLang])
  }

  agree(version: number) {
    if (globalThis.localStorage) {
      localStorage.setItem(TC_VERSION_ACCEPTED, version.toString())
    }
    this.router.navigate([this.i18nStore.activeLang, ERoutes.TEST])
  }
}
