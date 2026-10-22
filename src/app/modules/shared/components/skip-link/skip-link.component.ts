import { Component, input, ChangeDetectionStrategy } from "@angular/core"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"

@Component({
  selector: "app-skip-link",
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: "./skip-link.component.html",
})
export class SkipLinkComponent {
  linkId = input.required<string>()
  label = input.required<string>()
  href = input.required<string>()
}
