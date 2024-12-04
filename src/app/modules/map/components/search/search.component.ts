import { Component, HostListener, inject, Input } from "@angular/core"
import { FormsModule } from "@angular/forms"
import { MatFormFieldModule } from "@angular/material/form-field"
import { MatInputModule } from "@angular/material/input"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { NgFor, NgIf } from "@angular/common"
import {
  BehaviorSubject,
  debounceTime,
  distinctUntilChanged,
  from,
  map,
  of,
  switchMap,
  tap,
} from "rxjs"
import { IGeocodingFeature } from "../../interfaces/geocoding-feature.interface"
import { Map, Marker } from "maplibre-gl"
import { MapGeocoder } from "@angular/google-maps"
import { MatButtonModule } from "@angular/material/button"

@Component({
  selector: "app-search",
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    NgIf,
    NgFor,
    TranslatePipe,
  ],
  templateUrl: "./search.component.html",
  styleUrl: "./search.component.scss",
})
export class SearchComponent {
  @Input({ required: true }) map!: Map
  activeCandidate = 0
  geocodeResponse?: IGeocodingFeature[]
  geocodeRequest?: string
  geocodeRequestChanged = new BehaviorSubject<string | undefined>(undefined)
  geocoder!: google.maps.Geocoder
  marker?: Marker

  constructor() {
    this.initGeocoder()
  }

  async initGeocoder(): Promise<void> {
    const { Geocoder } = (await google.maps.importLibrary(
      "geocoding"
    )) as google.maps.GeocodingLibrary
    this.geocoder = new Geocoder()
  }

  private sub = this.geocodeRequestChanged
    .pipe(
      tap((evt) => {
        this.geocodeRequest = evt
      }),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((evt) => this.search(evt)),
      tap((res) => (this.geocodeResponse = res))
    )
    .subscribe()

  flyTo(evt: IGeocodingFeature, zoom?: number) {
    const { lng, lat } = evt.geometry.location
    if (!zoom && evt.geometry.bounds) {
      const southwest = evt.geometry.bounds.getSouthWest()
      const northeast = evt.geometry.bounds.getNorthEast()
      this.map.fitBounds([
        southwest.lng(),
        southwest.lat(),
        northeast.lng(),
        northeast.lat(),
      ])
    } else {
      this.map.flyTo({
        center: { lat: lat(), lng: lng() },
        zoom: zoom || this.map.getZoom(),
      })
    }
    this.marker?.remove()
    this.marker = new Marker({
      color: "#4668F2",
    })
      .setLngLat({ lat: lat(), lng: lng() })
      .addTo(this.map)
    this.geocodeRequest = evt.formatted_address
    this.resetGeocoder()
  }

  flyToActiveCandidate() {
    const location = this.geocodeResponse?.[this.activeCandidate]
    if (location) {
      this.flyTo(location)
    }
  }

  private search(q?: string) {
    if (q && q.length > 2) {
      return from(this.geocoder.geocode({ address: q })).pipe(
        map((res) => {
          return res.results
        })
      )
    }
    return of(undefined)
  }

  @HostListener("keyup.esc")
  @HostListener("document:mousedown", ["$event"])
  private resetGeocoder(evt?: MouseEvent) {
    const el = evt?.target as HTMLElement
    if (el?.className === "app-geocoder--suggestion-title") {
      this.flyToActiveCandidate()
    }
    if (
      el?.className !== "app-geocoder--suggestion-title" &&
      el?.className !== "app-geocoder--suggestion-address" &&
      el?.className !== "app-geocoder--suggestion"
    ) {
      this.geocodeResponse = undefined
      this.activeCandidate = 0
    }
  }

  @HostListener("keyup.arrowdown")
  private selectCandidateDown() {
    if (this.geocodeResponse?.length) {
      this.activeCandidate++
      if (this.activeCandidate > this.geocodeResponse?.length - 1) {
        this.activeCandidate = 0
      }
    }
  }

  @HostListener("keyup.arrowup")
  private selectCandidateUp() {
    if (this.geocodeResponse?.length) {
      this.activeCandidate--
      if (this.activeCandidate < 0) {
        this.activeCandidate = this.geocodeResponse?.length - 1
      }
    }
  }
}
