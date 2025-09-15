import { Component, input } from "@angular/core"
import { RouterModule } from "@angular/router"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { NgFor } from "@angular/common"
import { IBreadcrumb } from "../../../shared/interfaces/breadcrumb.interface"

@Component({
  selector: "app-certified-breadcrumbs",
  imports: [RouterModule, TranslatePipe, NgFor],
  templateUrl: "./certified-breadcrumbs.component.html",
  styleUrl: "./certified-breadcrumbs.component.scss",
})
export class CertifiedBreadcrumbsComponent {
  breadcrumbs = input.required<IBreadcrumb[]>()
}
