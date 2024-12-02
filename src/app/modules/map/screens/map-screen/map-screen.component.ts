import { Component, inject, OnInit } from "@angular/core"
import { SeoComponent } from "../../../shared/components/seo/seo.component"
import { MapService } from "../../services/map.service"

@Component({
  selector: "app-map-screen",
  standalone: true,
  imports: [],
  templateUrl: "./map-screen.component.html",
  styleUrl: "./map-screen.component.scss",
})
export class MapScreenComponent extends SeoComponent implements OnInit {
  mapService = inject(MapService)

  ngOnInit(): void {
    this.mapService.getFilters().subscribe()
  }
}
