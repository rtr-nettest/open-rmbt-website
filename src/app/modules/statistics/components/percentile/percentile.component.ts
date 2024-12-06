import { Component, Input } from "@angular/core"
import { IDynamicComponent } from "../../../shared/interfaces/dynamic-component.interface"

export type PercentileParametes = {
  red: number | undefined
  yellow: number | undefined
  green: number | undefined
  deepGreen: number | undefined
  label: number
}

@Component({
  selector: "app-percentile",
  standalone: true,
  imports: [],
  templateUrl: "./percentile.component.html",
  styleUrl: "./percentile.component.scss",
})
export class PercentileComponent
  implements IDynamicComponent<PercentileParametes>
{
  @Input() set parameters(value: PercentileParametes) {
    this.label = value.label
    const yellow = value.yellow != undefined ? value.yellow * 100 : 0
    const green = value.green != undefined ? value.green * 100 : 0
    const deepGreen = value.deepGreen != undefined ? value.deepGreen * 100 : 0
    this.colorStops = `linear-gradient(
      90deg,
      rgba(0,100,0,1) 0%,
      rgba(0,100,0,1) ${deepGreen - 1}%,
      rgba(255,255,255,1) ${deepGreen - 1}%,
      rgba(255,255,255,1) ${deepGreen},
      #59B200 ${deepGreen}%,
      #59B200 ${deepGreen + green - 1}%,
      rgba(255,255,255,1) ${deepGreen + green - 1}%,
      rgba(255,255,255,1) ${deepGreen + green}%,
      #FFBA00 ${deepGreen + green}%,
      #FFBA00 ${deepGreen + green + yellow - 1}%,
      rgba(255,255,255,1) ${deepGreen + green + yellow - 1}%,
      rgba(255,255,255,1) ${deepGreen + green + yellow}%,
      #CC0000 ${deepGreen + green + yellow}%)`
  }
  label: number | undefined
  colorStops: string = ""
}
