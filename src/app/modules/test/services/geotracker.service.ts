import { Injectable } from "@angular/core"
import { ICoords } from "../interfaces/coords.interface"

const _errorTimeout = 2e3 //2 seconds error timeout
const _maxAge = 60e3 //up to one minute old - don't do geoposition again

@Injectable({
  providedIn: "root",
})
export class GeoTrackerService {
  private _watcher: number | null = null

  constructor() {}

  async startGeoTracking(
    onError: (error: GeolocationPositionError) => void,
    onData: (data: ICoords) => void,
    isPermissionDenied: () => boolean
  ) {
    const onSuccess = (position: any, precise = false) => {
      const p = {
        geo_lat: position.coords.latitude,
        geo_long: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        bearing: position.coords.heading,
        speed: position.coords.speed,
        tstamp: position.timestamp,
        provider: "Browser",
        precise,
      }
      onData(p)
    }

    if (!navigator.geolocation || isPermissionDenied()) {
      const message = !navigator.geolocation
        ? "Geolocation not supported"
        : "Geolocation permission denied"
      onError({
        code: 0,
        message,
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      })
      return
    }

    //try to get an rough first position
    navigator.geolocation.getCurrentPosition(
      (success) => {
        onSuccess(success)

        //and refine this position later
        this._watcher = navigator.geolocation.watchPosition(
          (success) => {
            onSuccess(success, true)
          },
          (error) => {
            onError(error)
          },
          {
            enableHighAccuracy: true,
            timeout: Infinity,
            maximumAge: 0,
          }
        )
      },
      (error) => {
        onError(error)
      },
      {
        enableHighAccuracy: false,
        timeout: _errorTimeout, //2 seconds
        maximumAge: _maxAge, //one minute
      }
    )
  }

  stopGeoTracking() {
    if (navigator.geolocation && this._watcher) {
      navigator.geolocation.clearWatch(this._watcher)
      this._watcher = null
    }
  }
}
