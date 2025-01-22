import { FormControl, FormGroup } from "@angular/forms"
import { NetworkMeasurementType } from "../constants/network-measurement-type"
import { ETileTypes } from "../constants/tile-type.enum"

export type FiltersForm = {
  networkMeasurementType: FormControl<NetworkMeasurementType | null>
  tiles: FormControl<ETileTypes | null>
  filters: FiltersFormFilters
}

export type FiltersFormFilters = FormGroup<{
  statistical_method: FormControl<number | null>
  period: FormControl<number | null>
  provider: FormControl<string | number | null>
  operator: FormControl<string | number | null>
  technology: FormControl<string | null>
}>
