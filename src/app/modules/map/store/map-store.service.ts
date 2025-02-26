import { Injectable, signal } from "@angular/core"
import { MapSourceOptions } from "../services/map.service"
import { MapInfoHash } from "../dto/map-info-hash"
import { IMapInfo } from "../interfaces/map-info.interface"
import { ETileTypes } from "../constants/tile-type.enum"

@Injectable({
  providedIn: "root",
})
export class MapStoreService {
  filters = signal<MapSourceOptions | null>(null)
  basemap = signal<string | null>(null)
  mapInfo!: MapInfoHash

  initFilters(mapInfo: IMapInfo) {
    this.mapInfo = new MapInfoHash(mapInfo)
    const networkMeasurementType =
      this.filters()?.networkMeasurementType ?? "mobile/download"
    const tiles = this.filters()?.tiles ?? Object.values(ETileTypes)[0]
    const filters = {
      statistical_method:
        this.filters()?.filters?.statistical_method ??
        this.mapInfo.getDefaultValueOf("STATISTICS")?.statistical_method,
      period:
        this.filters()?.filters?.period ??
        this.mapInfo.getDefaultValueOf("MAP_FILTER_PERIOD")?.period,
      provider:
        this.filters()?.filters?.provider ??
        this.mapInfo.getDefaultValueOf("PROVIDER")?.provider,
      technology:
        this.filters()?.filters?.technology ??
        this.mapInfo.getDefaultValueOf("MAP_FILTER_TECHNOLOGY")?.technology,
      operator:
        this.filters()?.filters?.operator ??
        this.mapInfo.getDefaultValueOf("MAP_FILTER_CARRIER")?.operator,
    }
    this.filters.set({
      networkMeasurementType,
      tiles,
      filters,
    })
  }
}
