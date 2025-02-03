import { Component, input, OnInit, output } from "@angular/core"
import { MatButtonModule } from "@angular/material/button"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { ScrollBottomComponent } from "../scroll-bottom/scroll-bottom.component"

@Component({
  selector: "app-agreement",
  standalone: true,
  imports: [MatButtonModule, TranslatePipe, ScrollBottomComponent],
  templateUrl: "./agreement.component.html",
  styleUrl: "./agreement.component.scss",
})
export class AgreementComponent implements OnInit {
  agreeChange = output<void>()
  cancelChange = output<void>()
  storageItem = input.required<[string, string]>()
  text = input.required<string>()
  title = input.required<string>()
  isRead = false

  ngOnInit(): void {
    this.watchForScroll()
  }

  watchForScroll = () => {
    if (!globalThis.document) {
      return
    }
    const interval = setInterval(() => {
      const viewportHeight =
        document.querySelector(".app-wrapper")?.getBoundingClientRect()
          .height || 0
      const articleHeight =
        (document.querySelector(".app-article")?.getBoundingClientRect()
          .height || 0) - viewportHeight
      const articleY =
        document.querySelector(".app-article")?.getBoundingClientRect().y || 0
      if (Math.abs(articleY) > articleHeight) {
        this.isRead = true
        clearInterval(interval)
      }
    }, 300)
  }

  cancel() {
    this.cancelChange.emit()
  }

  agree() {
    const value = this.storageItem()
    if (globalThis.localStorage && value && value.length > 1) {
      localStorage.setItem(value[0], value[1])
    }
    this.agreeChange.emit()
  }
}
