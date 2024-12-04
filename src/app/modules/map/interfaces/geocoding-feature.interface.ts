/// <reference types="@types/google.maps" />

export interface LatLng {
  lat: number
  lng: number
  alt?: number | undefined
}

export interface LatLngBounds {
  northeast: LatLng
  southwest: LatLng
}

export interface IGeocodingFeature extends google.maps.GeocoderResult {}
