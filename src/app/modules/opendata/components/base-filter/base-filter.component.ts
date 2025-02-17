import { Component, Input } from "@angular/core"
import { FormControl, FormGroup } from "@angular/forms"
import { FiltersForm } from "../../interfaces/filters-form"

@Component({
  selector: "app-base-filter",
  imports: [],
  templateUrl: "./base-filter.component.html",
  styleUrl: "./base-filter.component.scss",
})
export class BaseFilterComponent {
  @Input({ required: true }) form!: FormGroup<FiltersForm>
  @Input({ required: true }) key!: string

  getFormControl(key: string) {
    return this.form.get(key) as FormControl
  }
}
