import { Component, Input } from "@angular/core"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { MatFormFieldModule } from "@angular/material/form-field"
import { MatInputModule } from "@angular/material/input"
import { Range } from "../../dto/range.dto"
import { ReactiveFormsModule } from "@angular/forms"
import { BaseFilterComponent } from "../base-filter/base-filter.component"

@Component({
  selector: "app-ranges-filter",
  imports: [
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    TranslatePipe,
  ],
  templateUrl: "./ranges-filter.component.html",
  styleUrl: "./ranges-filter.component.scss",
})
export class RangesFilterComponent extends BaseFilterComponent {
  @Input({ required: true }) ranges!: Map<string, Range>
}
