import { Injectable } from "@angular/core"
import { Popup, Map } from "maplibre-gl"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import tz from "dayjs/plugin/timezone"

dayjs.extend(utc)
dayjs.extend(tz)

@Injectable({
  providedIn: "root",
})
export class PopupService {
  private popup!: Popup

  async addPopup(
    mapContainer: Map,
    content: string,
    at: {
      lon: number
      lat: number
    },
  ) {
    if (!this.popup) {
      this.popup = new Popup()
    }

    const { lon, lat } = at
    this.popup.setLngLat([lon, lat]).addTo(mapContainer).setHTML(content)
  }

  removePopup() {
    this.popup?.remove()
  }
}
