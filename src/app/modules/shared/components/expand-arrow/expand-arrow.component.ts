import { Component, Input } from "@angular/core"
import { arrowRotate } from "../../animations/arrow-rotate.animation"

@Component({
  animations: [arrowRotate],
  selector: "app-expand-arrow",
  templateUrl: "./expand-arrow.component.html",
  styleUrls: ["./expand-arrow.component.scss"],
  standalone: true,
})
export class ExpandArrowComponent {
  @Input() parameters?: { expanded: boolean }
}
