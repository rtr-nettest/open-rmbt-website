
import { Component, Input } from "@angular/core"
import { MatButtonModule } from "@angular/material/button"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"

@Component({
    selector: "app-scroll-bottom",
    templateUrl: "./scroll-bottom.component.html",
    styleUrls: ["./scroll-bottom.component.scss"],
    imports: [MatButtonModule, TranslatePipe]
})
export class ScrollBottomComponent {
  @Input() isVisible = true
  @Input() scrollableSelector = ".app-article"

  handleClick() {
    const body = document.querySelector(this.scrollableSelector)
    if (!body) {
      return
    }
    const lastP = document.querySelector(
      `${this.scrollableSelector}>p:last-of-type`
    )
    lastP?.scrollIntoView({
      behavior: "smooth",
    })
  }
}
