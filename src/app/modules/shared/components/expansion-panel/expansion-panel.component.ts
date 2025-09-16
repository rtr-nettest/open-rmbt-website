import { Component, input, model, output, ViewChild } from "@angular/core"
import {
  MatExpansionModule,
  MatExpansionPanel,
} from "@angular/material/expansion"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { MatButtonModule } from "@angular/material/button"
import { MatIconModule } from "@angular/material/icon"

@Component({
  selector: "app-expansion-panel",
  imports: [MatExpansionModule, MatButtonModule, MatIconModule, TranslatePipe],
  templateUrl: "./expansion-panel.component.html",
  styleUrl: "./expansion-panel.component.scss",
})
export class ExpansionPanelComponent {
  @ViewChild(MatExpansionPanel) panel!: MatExpansionPanel

  title = input.required<string>()
  a11yTitle = input.required<string>()
  expand = output<boolean>()
}
