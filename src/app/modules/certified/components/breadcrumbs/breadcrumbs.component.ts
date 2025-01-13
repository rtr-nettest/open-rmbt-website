import { Component, input, Input, signal } from "@angular/core"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { AsyncPipe, NgFor } from "@angular/common"
import { map, Observable } from "rxjs"
import { ILink } from "../../../shared/interfaces/link.interface"
import { I18nStore } from "../../../i18n/store/i18n.store"
import { ERoutes } from "../../../shared/constants/routes.enum"
import { RouterModule } from "@angular/router"
import { CertifiedStoreService } from "../../store/certified-store.service"

@Component({
  selector: "app-certified-breadcrumbs",
  standalone: true,
  imports: [RouterModule, TranslatePipe, NgFor],
  templateUrl: "./breadcrumbs.component.html",
  styleUrl: "./breadcrumbs.component.scss",
})
export class BreadcrumbsComponent {
  get breadcrumbs() {
    return this.store.breadcrumbs
  }

  constructor(private readonly store: CertifiedStoreService) {}
}
