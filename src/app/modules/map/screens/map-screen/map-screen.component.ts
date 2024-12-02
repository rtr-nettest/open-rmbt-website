import { Component, inject, OnInit } from "@angular/core"
import { SeoComponent } from "../../../shared/components/seo/seo.component"
import { MapService } from "../../services/map.service"
import { HeaderComponent } from "../../../shared/components/header/header.component"
import { TopNavComponent } from "../../../shared/components/top-nav/top-nav.component"
import { BreadcrumbsComponent } from "../../../shared/components/breadcrumbs/breadcrumbs.component"
import { FooterComponent } from "../../../shared/components/footer/footer.component"

@Component({
  selector: "app-map-screen",
  standalone: true,
  imports: [
    HeaderComponent,
    TopNavComponent,
    BreadcrumbsComponent,
    FooterComponent,
  ],
  templateUrl: "./map-screen.component.html",
  styleUrl: "./map-screen.component.scss",
})
export class MapScreenComponent extends SeoComponent implements OnInit {
  mapService = inject(MapService)

  ngOnInit(): void {
    this.mapService.getFilters().subscribe()
  }
}
