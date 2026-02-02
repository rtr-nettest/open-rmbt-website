import { Component, Input } from "@angular/core"
import { ReactiveFormsModule } from "@angular/forms"
import { MatFormFieldModule } from "@angular/material/form-field"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { BaseFilterComponent } from "../base-filter/base-filter.component"
import { MatOptionModule } from "@angular/material/core"
import { MatSelectModule } from "@angular/material/select"


@Component({
  selector: "app-selects-filter",
  imports: [
    MatFormFieldModule,
    MatOptionModule,
    MatSelectModule,
    ReactiveFormsModule,
    TranslatePipe
],
  templateUrl: "./selects-filter.component.html",
  styleUrl: "./selects-filter.component.scss",
})
export class SelectsFilterComponent extends BaseFilterComponent {
  @Input({ required: true }) selects!: Map<string, (string | number)[][]>
}
