import { Component, Input } from "@angular/core"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { RouterModule } from "@angular/router"
import { NgTemplateOutlet } from "@angular/common"

@Component({
  selector: "app-card-button",
  templateUrl: "./card-button.component.html",
  styleUrls: ["./card-button.component.scss"],
  imports: [TranslatePipe, NgTemplateOutlet, RouterModule],
})
export class CardButtonComponent {
  @Input() iconImage?: string
  @Input() primary = false
  @Input({ required: true }) smallText!: string
  @Input() title?: string
  @Input() mobileLink?: string
  @Input() routerLink?: string
  @Input() url?: string

  get ariaLabel(): string {
    const action = this.primary
      ? `Press 'Enter' to start test or 'T' to go to the top of the page`
      : ""
    return action
  }
}
