import { Component } from "@angular/core"
import { HeaderComponent } from "../../../shared/components/header/header.component"
import { TopNavComponent } from "../../../shared/components/top-nav/top-nav.component"
import { FooterComponent } from "../../../shared/components/footer/footer.component"
import { SeoComponent } from "../../../shared/components/seo/seo.component"
import { BreadcrumbsComponent } from "../../../shared/components/breadcrumbs/breadcrumbs.component"
import { Observable } from "rxjs"
import { AsyncPipe } from "@angular/common"
import { CardButtonComponent } from "../../components/card-button/card-button.component"
import { ERoutes } from "../../../shared/constants/routes.enum"
import { IpInfoComponent } from "../../components/ip-info/ip-info.component"

@Component({
  selector: "app-landing",
  standalone: true,
  imports: [
    AsyncPipe,
    BreadcrumbsComponent,
    CardButtonComponent,
    HeaderComponent,
    IpInfoComponent,
    FooterComponent,
    TopNavComponent,
    BreadcrumbsComponent,
  ],
  templateUrl: "./home.component.html",
  styleUrl: "./home.component.scss",
})
export class HomeComponent extends SeoComponent {
  text$: Observable<string> = this.i18nStore.getLocalizedHtml("home")
  eRoutes = ERoutes
}
