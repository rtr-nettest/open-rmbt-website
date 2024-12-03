import { Component, effect, input } from "@angular/core"
import { IMapInfo } from "../../interfaces/map-info.interface"
import { IMapTypeOption } from "../../interfaces/map-type.interface"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"

@Component({
  selector: "app-heatmap-legend",
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: "./heatmap-legend.component.html",
  styleUrl: "./heatmap-legend.component.scss",
})
export class HeatmapLegendComponent {
  readonly mapInfo = input.required<IMapInfo>()
  readonly activeLayer = input.required<string>()
  activeOption: IMapTypeOption | undefined
  colorStops: string = ""

  constructor() {
    effect(() => {
      const searchParams = new URLSearchParams(this.activeLayer().split("?")[1])
      const mapType = searchParams.get("map_options")
      console.log("mapType", mapType)
      for (const tech of this.mapInfo().mapfilter.mapTypes) {
        this.activeOption = tech.options.find(
          (option) => option.map_options === mapType
        )
        if (this.activeOption) {
          this.colorStops = `linear-gradient(to right, ${this.activeOption?.heatmap_colors.join(
            ","
          )})`
          console.log("this.colorStops", this.colorStops)
          break
        }
      }
    })
  }
}
