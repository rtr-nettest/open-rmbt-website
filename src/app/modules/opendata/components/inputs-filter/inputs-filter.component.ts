import { Component } from "@angular/core"
import { BaseFilterComponent } from "../base-filter/base-filter.component"
import { ReactiveFormsModule } from "@angular/forms"
import { MatFormFieldModule } from "@angular/material/form-field"
import { MatInputModule } from "@angular/material/input"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"

@Component({
  selector: "app-inputs-filter",
  imports: [
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    TranslatePipe,
  ],
  templateUrl: "./inputs-filter.component.html",
  styleUrl: "./inputs-filter.component.scss",
})
export class InputsFilterComponent extends BaseFilterComponent {}
