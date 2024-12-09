import { Component, Input } from "@angular/core"
import { IDynamicComponent } from "../../../shared/interfaces/dynamic-component.interface"
import { MatMenuModule } from "@angular/material/menu"

export type PercentileParametes = {
  red: number | undefined
  yellow: number | undefined
  green: number | undefined
  deepGreen: number | undefined
  label: number
  provider: string
  units: string
}

@Component({
  selector: "app-percentile",
  standalone: true,
  imports: [MatMenuModule],
  templateUrl: "./percentile.component.html",
  styleUrl: "./percentile.component.scss",
})
export class PercentileComponent
  implements IDynamicComponent<PercentileParametes>
{
  @Input() set parameters(value: PercentileParametes) {
    this.label = value.label
    this.provider = value.provider
    this.units = value.units
    const yellow = value.yellow != undefined ? value.yellow * 100 : 0
    const green = value.green != undefined ? value.green * 100 : 0
    const deepGreen = value.deepGreen != undefined ? value.deepGreen * 100 : 0
    const red = 100 - yellow - green - deepGreen
    this.percents = [
      {
        value: Math.round(red),
        icon: "app-popup-icon",
      },
      {
        value: Math.round(yellow),
        icon: "app-popup-icon",
      },
      {
        value: Math.round(green),
        icon: "app-popup-icon",
      },
      {
        value: Math.round(deepGreen),
        icon: "app-popup-icon",
      },
    ]
      .map(({ value, icon }, i) => ({
        value,
        icon: icon + ` app-popup-icon--${i + 1}`,
      }))
      .reverse()
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
  percents: { value: number; icon: string }[] = []
  provider: string = ""
  units: string = ""
}
