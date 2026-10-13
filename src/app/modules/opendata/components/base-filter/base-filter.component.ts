import { Component, Input, OnDestroy, ChangeDetectionStrategy } from "@angular/core"
import { FormControl, FormGroup } from "@angular/forms"
import { FiltersForm } from "../../interfaces/filters-form"
import { Subject } from "rxjs"

@Component({
  selector: "app-base-filter",
  imports: [],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: "",
})
export class BaseFilterComponent implements OnDestroy {
  @Input({ required: true }) form!: FormGroup<FiltersForm>
  @Input({ required: true }) key!: string
  protected destroyed$ = new Subject<void>()

  getFormControl(key: string) {
    return this.form.get(key) as FormControl
  }

  ngOnDestroy(): void {
    this.destroyed$.next()
    this.destroyed$.complete()
  }
}
