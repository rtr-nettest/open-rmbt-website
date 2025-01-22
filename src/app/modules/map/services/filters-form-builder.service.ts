import { FormControl, FormGroup } from "@angular/forms"
import { MapInfoHash } from "../dto/map-info-hash"
import { FiltersForm } from "../interfaces/filter-form"
import { ETileTypes } from "../constants/tile-type.enum"
import { MapStoreService } from "../store/map-store.service"

export abstract class FiltersFormBuilderService {
  protected abstract store: MapStoreService
  abstract build(mapInfo: MapInfoHash, form?: FormGroup<FiltersForm>): FormGroup

  disable(): FormControl {
    return new FormControl({
      value: "",
      disabled: true,
    })
  }

  getOperatorControl(mapInfo: MapInfoHash): FormControl {
    return new FormControl<string | number | null>(
      this.store.filters()?.filters?.operator ??
        mapInfo.getDefaultValueOf("MAP_FILTER_CARRIER")?.operator ??
        null
    )
  }

  getProviderControl(mapInfo: MapInfoHash): FormControl {
    return new FormControl<string | number | null>(
      this.store.filters()?.filters?.provider ??
        mapInfo.getDefaultValueOf("PROVIDER")?.provider ??
        null
    )
  }

  getPeriodControl(mapInfo: MapInfoHash): FormControl {
    return new FormControl(
      this.store.filters()?.filters?.period ??
        mapInfo.getDefaultValueOf("MAP_FILTER_PERIOD")?.period ??
        null
    )
  }

  getStatisticsControl(
    mapInfo: MapInfoHash,
    form?: FormGroup<FiltersForm>
  ): FormControl {
    return new FormControl({
      value:
        this.store.filters()?.filters?.statistical_method ??
        mapInfo.getDefaultValueOf("STATISTICS")?.statistical_method ??
        null,
      disabled: form?.controls.tiles.value == ETileTypes.points,
    })
  }

  getTechnologyControl(mapInfo: MapInfoHash): FormControl {
    return new FormControl(
      this.store.filters()?.filters?.technology ??
        mapInfo.getDefaultValueOf("MAP_FILTER_TECHNOLOGY")?.technology ??
        null
    )
  }
}
