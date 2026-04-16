import { Injectable } from "@angular/core"
import { Popup, Map } from "maplibre-gl"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import tz from "dayjs/plugin/timezone"
import { PopupContentService } from "./popup-content.service"

dayjs.extend(utc)
dayjs.extend(tz)

@Injectable({
  providedIn: "root",
})
export class PopupService {
  private popup!: Popup

  async addPopup<T extends PopupContentService>(
    mapContainer: Map,
    measurements: Record<string, any>[],
    contentService: T,
    at?: {
      lon: number
      lat: number
    },
  ) {
    const content = await contentService.getPopupContent(measurements)
    if (!this.popup) {
      this.popup = new Popup()
    }

    const lon = at?.lon ?? measurements[0]["long"]
    const lat = at?.lat ?? measurements[0]["lat"]
    this.popup.setLngLat([lon, lat]).addTo(mapContainer).setHTML(content)
  }

  removePopup() {
    this.popup?.remove()
  }
}
