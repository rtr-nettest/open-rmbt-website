import { Component, Input } from "@angular/core"
import { BaseFilterComponent } from "../base-filter/base-filter.component"
import { NgFor } from "@angular/common"
import { ReactiveFormsModule } from "@angular/forms"
import { MatOptionModule } from "@angular/material/core"
import { MatFormFieldModule } from "@angular/material/form-field"
import { MatSelectModule } from "@angular/material/select"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { MatInputModule } from "@angular/material/input"

@Component({
  selector: "app-timespan-filter",
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatOptionModule,
    MatSelectModule,
    ReactiveFormsModule,
    TranslatePipe,
  ],
  templateUrl: "./timespan-filter.component.html",
  styleUrl: "./timespan-filter.component.scss",
})
export class TimespanFilterComponent extends BaseFilterComponent {
  @Input({ required: true }) timeUnits!: string[][]
}
