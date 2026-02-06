import { AsyncPipe } from "@angular/common"
import {
  AfterViewInit,
  Component,
  HostListener,
  inject,
  signal,
} from "@angular/core"
import { HeaderComponent } from "../../../shared/components/header/header.component"
import { HeatmapLegendComponent } from "../../components/heatmap-legend/heatmap-legend.component"
import { TopNavComponent } from "../../../shared/components/top-nav/top-nav.component"
import { BreadcrumbsComponent } from "../../../shared/components/breadcrumbs/breadcrumbs.component"
import { FooterComponent } from "../../../shared/components/footer/footer.component"
import { MatDialogModule } from "@angular/material/dialog"
import { SearchComponent } from "../../components/search/search.component"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { MainContentComponent } from "../../../shared/components/main-content/main-content.component"
import { SeoComponent } from "../../../shared/components/seo/seo.component"
import { MapComponent } from "../../components/map/map.component"
import { LiveService } from "../../../opendata/services/live.service"
import { FullScreenService } from "../../services/full-screen.service"
import { FullscreenControl, NavigationControl } from "maplibre-gl"
import { set } from "ol/transform"

@Component({
  selector: "app-live-screen",
  imports: [
    HeaderComponent,
    TopNavComponent,
    BreadcrumbsComponent,
    FooterComponent,
    MapComponent,
    MatDialogModule,
    MainContentComponent,
    TranslatePipe,
  ],
  templateUrl: "./live-screen.component.html",
  styleUrl: "./live-screen.component.scss",
})
export class LiveScreenComponent extends SeoComponent implements AfterViewInit {
  private readonly fullScreenService = inject(FullScreenService)
  private readonly liveService = inject(LiveService)

  mapContainerId = "liveMapContainer"
  mapControls = [new NavigationControl(), new FullscreenControl()]
  showOverlay = signal(true)
  recentMeasurements = this.liveService.recentMeasurements

  ngAfterViewInit(): void {
    this.liveService.watchMeasurements()
  }

  @HostListener("document:keypress", ["$event"])
  handleKeyDown(event: KeyboardEvent) {
    this.showOverlay.set(false)
    if (event.key === "m") {
      this.fullScreenService.toggleFullScreen()
    }
  }

  @HostListener("document:click")
  handleClick() {
    this.showOverlay.set(false)
  }
}
