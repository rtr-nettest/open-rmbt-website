import { Component, inject, OnInit } from "@angular/core"
import { HeaderComponent } from "../../../shared/components/header/header.component"
import { TopNavComponent } from "../../../shared/components/top-nav/top-nav.component"
import { FooterComponent } from "../../../shared/components/footer/footer.component"
import { AsyncPipe } from "@angular/common"
import { MatButtonModule } from "@angular/material/button"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { Router } from "@angular/router"
import { ERoutes } from "../../../shared/constants/routes.enum"
import { CertifiedStoreService } from "../../store/certified-store.service"
import { Observable } from "rxjs"
import { BreadcrumbsComponent } from "../../../shared/components/breadcrumbs/breadcrumbs.component"
import { ECertifiedSteps } from "../../constants/certified-steps.enum"
import { SeoComponent } from "../../../shared/components/seo/seo.component"
import { CertifiedBreadcrumbsComponent } from "../../components/certified-breadcrumbs/certified-breadcrumbs.component"
import { MainContentComponent } from "../../../shared/components/main-content/main-content.component"

@Component({
  selector: "app-step-1",
  imports: [
    AsyncPipe,
    BreadcrumbsComponent,
    CertifiedBreadcrumbsComponent,
    HeaderComponent,
    MainContentComponent,
    MatButtonModule,
    TopNavComponent,
    TranslatePipe,
    FooterComponent,
  ],
  templateUrl: "./step-1.component.html",
  styleUrl: "./step-1.component.scss",
})
export class Step1Component extends SeoComponent implements OnInit {
  text$!: Observable<string>
  private readonly router = inject(Router)
  private readonly store = inject(CertifiedStoreService)

  get breadcrumbs() {
    return this.store.breadcrumbs
  }

  constructor() {
    super()
    this.text$ = this.i18nStore.getLocalizedHtml("certified-step-1")
  }

  ngOnInit(): void {
    this.store.activeBreadcrumbIndex.set(ECertifiedSteps.INFO)
  }

  onNext() {
    this.router.navigate([this.i18nStore.activeLang, ERoutes.CERTIFIED_2])
  }
}
