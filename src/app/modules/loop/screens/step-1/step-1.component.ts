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
import { FooterComponent } from "../../../shared/components/footer/footer.component"
import { LoopStoreService } from "../../store/loop-store.service"
import { ECertifiedSteps } from "../../../certified/constants/certified-steps.enum"
import { MatButtonModule } from "@angular/material/button"
import { CertifiedBreadcrumbsComponent } from "../../../certified/components/certified-breadcrumbs/certified-breadcrumbs.component"
import { MainContentComponent } from "../../../shared/components/main-content/main-content.component"

@Component({
  selector: "app-step-1",
  imports: [
    AsyncPipe,
    BreadcrumbsComponent,
    CertifiedBreadcrumbsComponent,
    FooterComponent,
    HeaderComponent,
    MainContentComponent,
    MatButtonModule,
    TopNavComponent,
    TranslatePipe,
  ],
  templateUrl: "./step-1.component.html",
  styleUrl: "./step-1.component.scss",
})
export class Step1Component extends SeoComponent {
  loopStore = inject(LoopStoreService)
  router = inject(Router)
  storageItem: [string, string] = [LOOP_ACCEPTED, "true"]
  text$: Observable<string> = this.i18nStore.getLocalizedHtml("loop-step-1")

  get breadcrumbs() {
    return this.loopStore.breadcrumbs
  }

  ngOnInit(): void {
    this.loopStore.activeBreadcrumbIndex.set(ECertifiedSteps.INFO)
  }

  onNext() {
    this.router.navigate([this.i18nStore.activeLang, ERoutes.LOOP_2])
  }
}
