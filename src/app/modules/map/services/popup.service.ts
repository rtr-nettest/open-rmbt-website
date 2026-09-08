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
    this.ensurePopupVisibility(mapContainer)
  }

  removePopup() {
    this.popup?.remove()
  }

  private ensurePopupVisibility(mapContainer: Map) {
    requestAnimationFrame(() => {
      const containerEl = mapContainer.getContainer()
      const popupEl = this.popup.getElement()
      if (!containerEl || !popupEl) return

      const padding = 16
      const containerRect = containerEl.getBoundingClientRect()
      const popupRect = popupEl.getBoundingClientRect()
      const overflowBottom = popupRect.bottom - containerRect.bottom + padding
      const overflowTop = containerRect.top - popupRect.top + padding

      // positive offsetY moves the point up (more room below), negative moves it down
      const offsetY =
        overflowBottom > 0 ? overflowBottom : overflowTop > 0 ? -overflowTop : 0
      if (offsetY !== 0) {
        mapContainer.panBy([0, offsetY], { duration: 100 })
      }
    })
  }
}
