import {
  AfterViewInit,
  Component,
  HostListener,
  inject,
  signal,
} from "@angular/core"
import { HeaderComponent } from "../../../shared/components/header/header.component"
import { TopNavComponent } from "../../../shared/components/top-nav/top-nav.component"
import { BreadcrumbsComponent } from "../../../shared/components/breadcrumbs/breadcrumbs.component"
import { FooterComponent } from "../../../shared/components/footer/footer.component"
import { MatDialogModule } from "@angular/material/dialog"
import { SeoComponent } from "../../../shared/components/seo/seo.component"
import { MapComponent } from "../../components/map/map.component"
import { LiveService } from "../../../opendata/services/live.service"
import { FullScreenService } from "../../services/full-screen.service"
import { FullscreenControl, NavigationControl } from "maplibre-gl"
import { MessageService } from "../../../shared/services/message.service"

@Component({
  selector: "app-live-screen",
  imports: [
    HeaderComponent,
    TopNavComponent,
    BreadcrumbsComponent,
    FooterComponent,
    MapComponent,
    MatDialogModule,
  ],
  templateUrl: "./live-screen.component.html",
  styleUrl: "./live-screen.component.scss",
})
export class LiveScreenComponent extends SeoComponent implements AfterViewInit {
  private readonly fullScreenService = inject(FullScreenService)
  private readonly liveService = inject(LiveService)
  private readonly messageService = inject(MessageService)

  mapContainerId = "liveMapContainer"
  mapControls = [new NavigationControl(), new FullscreenControl()]
  recentMeasurements = this.liveService.recentMeasurements
  showOverlay = signal(false)

  ngAfterViewInit(): void {
    this.liveService.watchMeasurements()
    this.messageService.openSnackbar("LiveMapOverlayMessage")
    setTimeout(() => {
      this.showOverlay.set(true)
    }, 1500)
    setTimeout(() => {
      this.showOverlay.set(false)
    }, 4500)
  }

  @HostListener("document:keypress", ["$event"])
  handleKeyDown(event: KeyboardEvent) {
    if (event.key === "m") {
      this.fullScreenService.toggleFullScreen()
    }
  }
}
