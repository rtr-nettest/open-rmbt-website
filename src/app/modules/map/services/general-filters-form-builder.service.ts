import { Injectable } from "@angular/core"
import { FormBuilder, FormControl, FormGroup } from "@angular/forms"
import { MapInfoHash } from "../dto/map-info-hash"
import { MapStoreService } from "../store/map-store.service"
import { FiltersForm } from "../interfaces/filter-form"
import { FiltersFormBuilderService } from "./filters-form-builder.service"

@Injectable({
  providedIn: "root",
})
export class GeneralFiltersFormBuilderService extends FiltersFormBuilderService {
  constructor(
    private readonly fb: FormBuilder,
    protected readonly store: MapStoreService
  ) {
    super()
  }

  build(mapInfo: MapInfoHash, form?: FormGroup<FiltersForm>): FormGroup {
    return this.fb.group({
      statistical_method: this.getStatisticsControl(mapInfo, form),
      period: this.getPeriodControl(mapInfo),
      technology: this.disable(),
      operator: this.disable(),
      provider: this.disable(),
    })
  }
}
