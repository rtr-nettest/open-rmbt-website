import { Component, Input } from "@angular/core"
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner"

@Component({
    selector: "app-loading-overlay",
    imports: [MatProgressSpinnerModule],
    templateUrl: "./loading-overlay.component.html",
    styleUrl: "./loading-overlay.component.scss"
})
export class LoadingOverlayComponent {
  @Input() progressInterval?: NodeJS.Timeout
  @Input() progress = 0
}
