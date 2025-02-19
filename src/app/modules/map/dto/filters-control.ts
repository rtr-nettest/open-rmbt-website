import { IControl, Map } from "maplibre-gl"
import { I18nStore } from "../../i18n/store/i18n.store"

export class FiltersControl implements IControl {
  private map: Map | undefined
  private container!: HTMLElement

  constructor(private i18nStore: I18nStore, private onClick: () => void) {}

  onAdd(map: Map) {
    this.map = map
    this.container = document.createElement("div")
    this.container.className = "maplibregl-ctrl maplibregl-ctrl-group"
    this.container.innerHTML = `<button class="maplibregl-ctrl-filters" type="button" aria-label="${this.i18nStore.translate(
      "Show filters"
    )}" title="${this.i18nStore.translate(
      "Show filters"
    )}"><mat-icon role="img" fontset="material-symbols-outlined" class="mat-icon notranslate material-symbols-outlined mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font" data-mat-icon-namespace="material-symbols-outlined">tune</mat-icon></button>`
    this.container.onclick = () => {
      this.onClick()
    }
    return this.container
  }

  onRemove() {
    this.container.parentNode?.removeChild(this.container)
    this.map = undefined
  }
}
