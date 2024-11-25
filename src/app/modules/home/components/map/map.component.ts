import { Component, Input } from "@angular/core"
import { IRecentMeasurementsResponse } from "../../interfaces/recent-measurements-response.interface"

@Component({
  selector: "app-map",
  standalone: true,
  imports: [],
  templateUrl: "./map.component.html",
  styleUrl: "./map.component.scss",
})
export class MapComponent {
  @Input({ required: true }) measurements: IRecentMeasurementsResponse | null =
    null
}
