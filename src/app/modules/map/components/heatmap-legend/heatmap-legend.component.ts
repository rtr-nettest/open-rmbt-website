import { Component, computed, inject, input } from "@angular/core"
import { IMapInfo } from "../../interfaces/map-info.interface"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { NetworkMeasurementType } from "../../constants/network-measurement-type"
import { MapInfoHash } from "../../dto/map-info-hash"
import { IColorStop } from "../../interfaces/color-stop.interface"
import { I18nStore } from "../../../i18n/store/i18n.store"

@Component({
    selector: "app-heatmap-legend",
    imports: [TranslatePipe],
    templateUrl: "./heatmap-legend.component.html",
    styleUrl: "./heatmap-legend.component.scss"
})
export class HeatmapLegendComponent {
  i18nStore = inject(I18nStore)
  mapInfo = input.required<IMapInfo>()
  activeLayer = input.required<string>()
  mapType = computed(() => {
    const searchParams = new URLSearchParams(this.activeLayer().split("?")[1])
    const mapType = searchParams.get("map_options") ?? ""
    return mapType as NetworkMeasurementType
  })
  heatmapsMap = computed(() => {
    const retVal = new Map<NetworkMeasurementType, IColorStop[]>()
    const mapHash = new MapInfoHash(this.mapInfo())
    for (const networkType of mapHash.get("MAP_TYPE").options ?? []) {
      // Mobile, Browser, Wlan
      for (const metric of networkType.options ?? []) {
        // Download, Upload, Ping
        if (metric.params?.map_options) {
          retVal.set(metric.params.map_options, metric.heatmap)
        }
      }
    }
    return retVal
  })
  colorStops = computed(() => {
    this.captions = []
    const colorStops = this.heatmapsMap()
      .get(this.mapType())
      ?.map((stop) => {
        this.captions.push(stop.caption)
        return stop.color
      })
    if (colorStops?.length) {
      return `linear-gradient(to right, ${colorStops.join(",")})`
    }
    return ""
  })
  captions: string[] = []
  unit = computed(() => {
    const mapType = this.mapType()
    if (mapType.includes("download") || mapType.includes("upload")) {
      return this.i18nStore.translate("Mbps")
    } else if (mapType.includes("ping")) {
      return this.i18nStore.translate("millis")
    } else {
      return this.i18nStore.translate("dBm")
    }
  })
}
