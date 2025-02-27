import { Component, input, model, output } from "@angular/core"
import { MatExpansionModule } from "@angular/material/expansion"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"

@Component({
  selector: "app-expansion-panel",
  imports: [MatExpansionModule, TranslatePipe],
  templateUrl: "./expansion-panel.component.html",
  styleUrl: "./expansion-panel.component.scss",
})
export class ExpansionPanelComponent {
  title = input.required<string>()
  a11yTitle = input.required<string>()
  expand = output<boolean>()
}
