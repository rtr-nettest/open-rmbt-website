import { Component, inject, OnInit } from "@angular/core"
import { Router } from "@angular/router"
import { Observable } from "rxjs"
import { AsyncPipe } from "@angular/common"
import { SeoComponent } from "../../../shared/components/seo/seo.component"
import { MatButtonModule } from "@angular/material/button"
import { TestService } from "../../services/test.service"
import { AgreementComponent } from "../../../shared/components/agreement/agreement.component"
import { ERoutes } from "../../../shared/constants/routes.enum"
import { TERMS_VERSION } from "../../constants/strings"
import { SettingsService } from "../../../shared/services/settings.service"
import { MainStore } from "../../../shared/store/main.store"

@Component({
  selector: "app-terms-conditions-screen",
  templateUrl: "./terms-conditions-screen.component.html",
  styleUrls: ["./terms-conditions-screen.component.scss"],
  imports: [AgreementComponent, AsyncPipe, MatButtonModule],
})
export class TermsConditionsScreenComponent
  extends SeoComponent
  implements OnInit
{
  mainStore = inject(MainStore)
  terms$!: Observable<string>
  router = inject(Router)
  service = inject(TestService)
  settingsService = inject(SettingsService)
  settings = this.mainStore.settings
  storageItem!: [string, string]
  termsText = ""
  nextRoute = ERoutes.TEST
  currentRoute = ERoutes.HOME

  ngOnInit(): void {
    const searchParams =
      globalThis.location && new URLSearchParams(globalThis.location.search)
    this.nextRoute = (searchParams.get("next") as ERoutes) || ERoutes.TEST
    this.currentRoute = (searchParams.get("current") as ERoutes) || ERoutes.HOME
    const settings = this.settings()
    if (settings) {
      this.storageItem = [
        TERMS_VERSION,
        settings.settings[0].terms_and_conditions.version.toString(),
      ]
    }
    this.terms$ = this.i18nStore.getLocalizedHtml("terms-and-conditions")
  }

  onAgree() {
    this.setCurrentRoute()
    this.router.navigate([this.i18nStore.activeLang, this.nextRoute])
  }

  onCancel() {
    this.router.navigate([this.i18nStore.activeLang])
  }

  private setCurrentRoute() {
    history.replaceState(
      {},
      "",
      `/${this.i18nStore.activeLang}/${this.currentRoute}`
    )
  }
}
