import { Component, Input } from "@angular/core"
import { IDynamicComponent } from "../../../shared/interfaces/dynamic-component.interface"
import { IQoeItem } from "../../interfaces/qoe-item.interface"
import { IDetailedHistoryResultItem } from "../../interfaces/detailed-history-result-item.interface"

const BAR_COUNT = 12

@Component({
  selector: "app-qoe-bar",
  imports: [],
  templateUrl: "./qoe-bar.component.html",
  styleUrl: "./qoe-bar.component.scss",
})
export class QoeBarComponent
  implements IDynamicComponent<IDetailedHistoryResultItem>
{
  @Input() set parameters(item: IDetailedHistoryResultItem) {
    const value = item.value as IQoeItem
    const fill = value.quality
      ? Math.max(1, Math.round(value.quality * this.bars.length))
      : 0
    this.bars = this.bars.map((_, i) => {
      return i + 1 <= fill ? value.classification : 0
    })
    this.fill = Math.round(fill * 100) + "%"
  }
  bars: number[] = Array.from({ length: BAR_COUNT })
  fill: string = "0%"
}
