import { Injectable } from "@angular/core"
import { FormBuilder, FormControl, FormGroup } from "@angular/forms"
import { ETileTypes } from "../constants/tile-type.enum"
import { MapInfoHash } from "../dto/map-info-hash"
import { MapStoreService } from "../store/map-store.service"
import { FiltersForm } from "../interfaces/filter-form"
import { FiltersFormBuilderService } from "./filters-form-builder.service"

@Injectable({
  providedIn: "root",
})
export class MobileFiltersFormBuilderService extends FiltersFormBuilderService {
  constructor(
    private readonly fb: FormBuilder,
    protected readonly store: MapStoreService
  ) {
    super()
  }

  build(mapInfo: MapInfoHash, form?: FormGroup<FiltersForm>): FormGroup {
    return this.fb.group({
      statistical_method: this.getStatisticsControl(mapInfo, form),
      operator: this.getOperatorControl(mapInfo),
      period: this.getPeriodControl(mapInfo),
      technology: this.getTechnologyControl(mapInfo),
      provider: this.disable(),
    })
  }
}
