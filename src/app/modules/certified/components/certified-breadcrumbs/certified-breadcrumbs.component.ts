import { Component, input } from "@angular/core"
import { RouterModule } from "@angular/router"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"

import { IBreadcrumb } from "../../../shared/interfaces/breadcrumb.interface"

@Component({
  selector: "app-certified-breadcrumbs",
  imports: [RouterModule, TranslatePipe],
  templateUrl: "./certified-breadcrumbs.component.html",
  styleUrl: "./certified-breadcrumbs.component.scss",
})
export class CertifiedBreadcrumbsComponent {
  breadcrumbs = input.required<IBreadcrumb[]>()
}
