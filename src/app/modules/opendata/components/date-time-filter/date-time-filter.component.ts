import { Component, effect, model, OnInit } from "@angular/core"
import { BaseFilterComponent } from "../base-filter/base-filter.component"
import { MatFormFieldModule } from "@angular/material/form-field"
import { MatInputModule } from "@angular/material/input"
import { MatDatepickerModule } from "@angular/material/datepicker"
import { MatTimepickerModule } from "@angular/material/timepicker"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { FormsModule, ReactiveFormsModule } from "@angular/forms"
import { provideAppDateAdapter } from "../../../shared/adapters/app-date.adapter"
import dayjs from "dayjs"
import { takeUntil } from "rxjs"

@Component({
  selector: "app-date-time-filter",
  providers: [provideAppDateAdapter()],
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatTimepickerModule,
    MatDatepickerModule,
    ReactiveFormsModule,
    TranslatePipe,
  ],
  templateUrl: "./date-time-filter.component.html",
  styleUrl: "./date-time-filter.component.scss",
})
export class DateTimeFilterComponent
  extends BaseFilterComponent
  implements OnInit
{
  time = model<Date | null>(null)

  constructor() {
    super()
    effect(() => {
      const newTime = this.time() ? dayjs(this.time()) : null
      const date = this.getFormControl(this.key).value
      if (!newTime || !date) {
        return
      }
      const newDate = dayjs(date)
        .set("hour", newTime.hour())
        .set("minute", newTime.minute())
        .toDate()
      this.getFormControl(this.key).setValue(newDate)
    })
  }

  ngOnInit(): void {
    if (this.getFormControl(this.key).value) {
      this.time.set(this.getFormControl(this.key).value)
    }
    this.form.controls.timespan.valueChanges
      .pipe(takeUntil(this.destroyed$))
      .subscribe(this.calculateTime)
    this.form.controls.timespan_unit.valueChanges
      .pipe(takeUntil(this.destroyed$))
      .subscribe(this.calculateTime)
  }

  private calculateTime = () => {
    if (this.getFormControl(this.key).value) {
      this.time.set(this.getFormControl(this.key).value)
    }
  }
}
