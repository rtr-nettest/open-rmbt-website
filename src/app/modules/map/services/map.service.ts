import { HttpClient } from "@angular/common/http"
import { Injectable } from "@angular/core"
import { environment } from "../../../../environments/environment"
import { NetworkMeasurementType } from "../interfaces/map-type.interface"
import { I18nStore } from "../../i18n/store/i18n.store"
import { IMapInfo } from "../interfaces/map-info.interface"
import { UUID } from "../../shared/constants/strings"

export type FilterType =
  | "statistical_method"
  | "operator"
  | "period"
  | "provider"
  | "technology"

export type MapSourceOptions = {
  networkMeasurementType: NetworkMeasurementType
  filterType?: { [key: string]: FilterType }
}

@Injectable({
  providedIn: "root",
})
export class MapService {
  get tileServer() {
    return `${environment.api.map}/RMBTMapServer/tiles`
  }

  constructor(
    private readonly http: HttpClient,
    private i18nStore: I18nStore
  ) {}

  getFilters() {
    const body: { [key: string]: any } = {
      version_name: "0.1",
      language: this.i18nStore.activeLang,
      type: "DESKTOP",
      version_code: "1",
      name: "RTR-Netztest",
      open_test_uuid: null,
    }
    if (globalThis.localStorage) {
      const uuid = localStorage.getItem(UUID)
      if (uuid) {
        body["uuid"] = uuid
        body["terms_and_conditions_accepted"] = true
      }
    }
    return this.http.post<IMapInfo>(`${this.tileServer}/info`, body)
  }

  getPointSource(options: MapSourceOptions) {
    return this.getSource("/points/{z}/{x}/{y}.png", options)
  }

  getHeatmapSource(options: MapSourceOptions) {
    return this.getSource("/heatmap/{z}/{x}/{y}.png", options)
  }

  getShapeSource(options: MapSourceOptions) {
    return this.getSource("/shapes/{z}/{x}/{y}.png", options)
  }

  private getSource(path: string, options: MapSourceOptions) {
    const { networkMeasurementType, filterType } = options
    let retVal = `${this.tileServer}${path}?null&map_options=${networkMeasurementType}`
    if (filterType) {
      for (const [key, val] of Object.values(filterType)) {
        retVal += `&${key}=${val}`
      }
    }
    return retVal
  }
}
