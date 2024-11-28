import { Component, inject, OnInit } from "@angular/core"
import { SeoComponent } from "../../../shared/components/seo/seo.component"
import { TestService } from "../../services/test.service"
import { Router } from "@angular/router"
import { map } from "rxjs"
import { TC_VERSION } from "../terms-conditions-screen/terms-conditions-screen.component"
import { ERoutes } from "../../../shared/constants/routes.enum"
import { HeaderComponent } from "../../../shared/components/header/header.component"
import { FooterComponent } from "../../../shared/components/footer/footer.component"
import { TopNavComponent } from "../../../shared/components/top-nav/top-nav.component"

@Component({
  selector: "app-test-screen",
  standalone: true,
  imports: [HeaderComponent, FooterComponent, TopNavComponent],
  templateUrl: "./test-screen.component.html",
  styleUrl: "./test-screen.component.scss",
})
export class TestScreenComponent extends SeoComponent implements OnInit {
  service = inject(TestService)
  router = inject(Router)

  ngOnInit(): void {
    this.service
      .getSettings()
      .pipe(
        map((settings) => {
          if (
            globalThis.localStorage &&
            settings.settings[0].terms_and_conditions.version.toString() !=
              localStorage.getItem(TC_VERSION)
          ) {
            this.router.navigate([this.i18nStore.activeLang, ERoutes.TERMS])
            return false
          }
          return true
        })
      )
      .subscribe()
  }
}
