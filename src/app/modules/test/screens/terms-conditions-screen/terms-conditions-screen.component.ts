import { Component, inject, OnInit } from "@angular/core"
import { Router } from "@angular/router"
import { Observable, tap } from "rxjs"
import { AsyncPipe } from "@angular/common"
import { IUserSetingsResponse } from "../../interfaces/user-settings-response.interface"
import { SeoComponent } from "../../../shared/components/seo/seo.component"
import { MatButtonModule } from "@angular/material/button"
import { TestService } from "../../services/test.service"
import { AgreementComponent } from "../../../shared/components/agreement/agreement.component"
import { ERoutes } from "../../../shared/constants/routes.enum"
import { TC_VERSION_ACCEPTED } from "../../constants/strings"
import { SettingsService } from "../../../shared/services/settings.service"

@Component({
    selector: "app-terms-conditions-screen",
    templateUrl: "./terms-conditions-screen.component.html",
    styleUrls: ["./terms-conditions-screen.component.scss"],
    imports: [AgreementComponent, AsyncPipe, MatButtonModule]
})
export class TermsConditionsScreenComponent
  extends SeoComponent
  implements OnInit
{
  terms$!: Observable<string>
  settings$!: Observable<IUserSetingsResponse>
  router = inject(Router)
  service = inject(TestService)
  settingsService = inject(SettingsService)
  storageItem!: [string, string]
  termsText = ""

  ngOnInit(): void {
    this.settings$ = this.settingsService.getSettings().pipe(
      tap((settings) => {
        this.storageItem = [
          TC_VERSION_ACCEPTED,
          settings.settings[0].terms_and_conditions.version.toString(),
        ]
      })
    )
    this.terms$ = this.i18nStore.getLocalizedHtml("terms-and-conditions")
  }

  onAgree() {
    this.router.navigate([this.i18nStore.activeLang, ERoutes.TEST])
  }

  onCancel() {
    this.router.navigate([this.i18nStore.activeLang, ERoutes.HOME])
  }
}
