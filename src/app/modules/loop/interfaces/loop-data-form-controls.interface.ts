import { FormControl } from "@angular/forms"

export interface ILoopDataFormControls {
  maxTestsAllowed: FormControl<number>
  testIntervalMinutes: FormControl<number>
}
