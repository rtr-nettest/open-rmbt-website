import { Component, Input, OnInit } from "@angular/core"
import { BaseFilterComponent } from "../base-filter/base-filter.component"

import { ReactiveFormsModule } from "@angular/forms"
import { MatOptionModule } from "@angular/material/core"
import { MatFormFieldModule } from "@angular/material/form-field"
import { MatSelectModule } from "@angular/material/select"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { MatInputModule } from "@angular/material/input"
import { takeUntil } from "rxjs"
import dayjs from "dayjs"

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
export class TimespanFilterComponent
  extends BaseFilterComponent
  implements OnInit
{
  @Input({ required: true }) timeUnits!: string[][]

  ngOnInit(): void {
    this.form.controls.timespan.valueChanges
      .pipe(takeUntil(this.destroyed$))
      .subscribe(this.calculateTime)
    this.form.controls.timespan_unit.valueChanges
      .pipe(takeUntil(this.destroyed$))
      .subscribe(this.calculateTime)
  }

  private calculateTime = () => {
    const timespan = this.form.get("timespan")?.value
    const timespan_unit = this.form.get("timespan_unit")?.value
    const time_to = this.form.get("time_to")?.value
    if (timespan && timespan_unit) {
      this.form?.controls.time_from.setValue(
        dayjs(time_to || new Date())
          .subtract(timespan, timespan_unit)
          .toDate()
      )
      if (!time_to) {
        this.form?.controls.time_to.setValue(new Date())
      }
    }
  }
}
