import { Component, Input } from "@angular/core"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { RouterModule } from "@angular/router"

@Component({
  selector: "app-card-button",
  templateUrl: "./card-button.component.html",
  styleUrls: ["./card-button.component.scss"],
  standalone: true,
  imports: [TranslatePipe, RouterModule],
})
export class CardButtonComponent {
  @Input() iconImage?: string
  @Input() primary = false
  @Input({ required: true }) smallText!: string
  @Input() title?: string
  @Input() routerLink?: string
}
