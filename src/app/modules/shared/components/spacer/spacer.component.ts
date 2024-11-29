import { ChangeDetectionStrategy, Component } from "@angular/core"

@Component({
  selector: "app-spacer",
  templateUrl: "./spacer.component.html",
  styleUrls: ["./spacer.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class SpacerComponent {}
