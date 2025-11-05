import { Component, input } from "@angular/core"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"

@Component({
  selector: "app-skip-link",
  imports: [TranslatePipe],
  templateUrl: "./skip-link.component.html",
})
export class SkipLinkComponent {
  linkId = input.required<string>()
  label = input.required<string>()
  href = input.required<string>()
}
