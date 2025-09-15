import { Injectable, OnDestroy, signal } from "@angular/core"
import { toObservable } from "@angular/core/rxjs-interop"

@Injectable({
  providedIn: "root",
})
export class ConnectivityService implements OnDestroy {
  isOnline = signal(true)
  isOnline$ = toObservable(this.isOnline)

  constructor() {
    globalThis.addEventListener("online", this.onlineListener.bind(this))
    globalThis.addEventListener("offline", this.offlineListener.bind(this))
  }

  ngOnDestroy() {
    globalThis.removeEventListener("online", this.onlineListener.bind(this))
    globalThis.removeEventListener("offline", this.offlineListener.bind(this))
  }

  private onlineListener() {
    this.isOnline.set(true)
  }

  private offlineListener() {
    this.isOnline.set(false)
  }
}
