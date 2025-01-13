import { Component, OnInit } from "@angular/core"
import { HeaderComponent } from "../../../shared/components/header/header.component"
import { TopNavComponent } from "../../../shared/components/top-nav/top-nav.component"
import { FooterComponent } from "../../../shared/components/footer/footer.component"
import { BreadcrumbsComponent as CertifiedBreadcrumbs } from "../../components/breadcrumbs/breadcrumbs.component"
import { I18nStore } from "../../../i18n/store/i18n.store"
import { AsyncPipe } from "@angular/common"
import { MatButtonModule } from "@angular/material/button"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { Router } from "@angular/router"
import { ERoutes } from "../../../shared/constants/routes.enum"
import { CertifiedStoreService } from "../../store/certified-store.service"
import { Observable } from "rxjs"
import { BreadcrumbsComponent } from "../../../shared/components/breadcrumbs/breadcrumbs.component"

@Component({
  selector: "app-step-1",
  standalone: true,
  imports: [
    AsyncPipe,
    BreadcrumbsComponent,
    CertifiedBreadcrumbs,
    HeaderComponent,
    MatButtonModule,
    TopNavComponent,
    TranslatePipe,
    FooterComponent,
  ],
  templateUrl: "./step-1.component.html",
  styleUrl: "./step-1.component.scss",
})
export class Step1Component implements OnInit {
  text$!: Observable<string>

  constructor(
    private readonly i18nStore: I18nStore,
    private readonly router: Router,
    private readonly store: CertifiedStoreService
  ) {
    this.text$ = this.i18nStore.getLocalizedHtml("certified-step-1")
  }

  ngOnInit(): void {
    this.store.activeBreadcrumbIndex.set(0)
  }

  onNext() {
    this.router.navigate([this.i18nStore.activeLang, ERoutes.CERTIFIED_2])
  }
}
