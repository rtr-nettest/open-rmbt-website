import { Component, inject, OnInit } from "@angular/core"
import { BreadcrumbsComponent } from "../../../shared/components/breadcrumbs/breadcrumbs.component"
import { HeaderComponent } from "../../../shared/components/header/header.component"
import { TopNavComponent } from "../../../shared/components/top-nav/top-nav.component"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { AsyncPipe } from "@angular/common"
import { SeoComponent } from "../../../shared/components/seo/seo.component"
import { Observable } from "rxjs"
import { Router } from "@angular/router"
import { ERoutes } from "../../../shared/constants/routes.enum"
import { LOOP_ACCEPTED } from "../../constants/strings"
import { AgreementComponent } from "../../../shared/components/agreement/agreement.component"

@Component({
  selector: "app-step-1",
  standalone: true,
  imports: [AgreementComponent, AsyncPipe, TranslatePipe],
  templateUrl: "./step-1.component.html",
  styleUrl: "./step-1.component.scss",
})
export class Step1Component extends SeoComponent {
  router = inject(Router)
  storageItem: [string, string] = [LOOP_ACCEPTED, "true"]
  text$: Observable<string> = this.i18nStore.getLocalizedHtml("loop-step-1")

  onCancel() {
    this.router.navigate([this.i18nStore.activeLang, ERoutes.HOME])
  }

  onAgree() {
    this.router.navigate([this.i18nStore.activeLang, ERoutes.LOOP_2])
  }
}
