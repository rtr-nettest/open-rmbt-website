import {
  Component,
  HostListener,
  Input,
  NgZone,
  OnDestroy,
} from "@angular/core"
import { FormsModule } from "@angular/forms"
import { MatFormFieldModule } from "@angular/material/form-field"
import { MatInputModule } from "@angular/material/input"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { NgFor, NgIf } from "@angular/common"
import {
  BehaviorSubject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  from,
  map,
  of,
  Subject,
  switchMap,
  tap,
} from "rxjs"
import { IGeocodingFeature } from "../../interfaces/geocoding-feature.interface"
import { Map, Marker } from "maplibre-gl"
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
export class SearchComponent implements OnDestroy {
  @Input({ required: true }) map!: Map
  activeCandidate = 0
  destroyed$ = new Subject<void>()
  geocodeResponse?: IGeocodingFeature[]
  geocodeRequest?: string
  geocodeRequestChanged = new BehaviorSubject<string | undefined>(undefined)
  geocoder!: google.maps.Geocoder
  marker?: Marker

  constructor(private readonly zone: NgZone) {
    this.initGeocoder()
  }

  ngOnDestroy(): void {
    this.destroyed$.next()
    this.destroyed$.complete()
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
    this.zone.runOutsideAngular(() => {
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
    })
    this.geocodeRequest = evt.formatted_address
    this.resetGeocoder()
  }

  flyToCandidate(index?: number) {
    const location = this.geocodeResponse?.[index ?? this.activeCandidate]
    if (location) {
      this.flyTo(location)
    }
  }

  private search(q?: string) {
    if (q && q.length > 2) {
      return from(this.geocoder.geocode({ address: q })).pipe(
        map((res) => {
          return res.results
        }),
        catchError(() => {
          return of([])
        })
      )
    }
    return of(undefined)
  }

  @HostListener("keyup.esc")
  private resetGeocoder(evt?: MouseEvent) {
    this.geocodeResponse = undefined
    this.activeCandidate = 0
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
