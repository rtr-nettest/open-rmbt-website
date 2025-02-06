import { Component, input } from "@angular/core"
import { RouterModule } from "@angular/router"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { NgFor } from "@angular/common"
import { IMainMenuItem } from "../../interfaces/main-menu-item.interface"
import { IBreadcrumb } from "../../interfaces/breadcrumb.interface"

@Component({
  selector: "app-certified-breadcrumbs",
  standalone: true,
  imports: [RouterModule, TranslatePipe, NgFor],
  templateUrl: "./certified-breadcrumbs.component.html",
  styleUrl: "./certified-breadcrumbs.component.scss",
})
export class CertifiedBreadcrumbsComponent {
  breadcrumbs = input.required<IBreadcrumb[]>()
}
