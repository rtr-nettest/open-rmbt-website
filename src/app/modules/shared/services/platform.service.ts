import { Injectable } from "@angular/core"

export enum EPlatform {
  WIN_PHONE,
  ANDROID,
  IOS,
  WINDOWS,
  MAC,
  LINUX,
  DESKTOP_OTHER,
}

@Injectable({
  providedIn: "root",
})
export class PlatformService {
  detectPlatform() {
    if (!globalThis.navigator) {
      return EPlatform.DESKTOP_OTHER
    }
    var mobile_client = navigator.userAgent

    if (mobile_client.match(/Windows Phone/)) {
      return EPlatform.WIN_PHONE
    } else if (
      mobile_client.match(/Android|Opera M(obi|ini)|Dolfin|Dolphin/g)
    ) {
      return EPlatform.ANDROID
    } else if (mobile_client.match(/iP(hone|od|ad)/g)) {
      return EPlatform.IOS
    }

    // Detects Windows (Note, doesn't differentiate between phone/pc)
    if (mobile_client.match(/Windows NT/)) {
      return EPlatform.WINDOWS
    } else if (mobile_client.match(/Mac OS X/)) {
      return EPlatform.MAC
    } else if (mobile_client.match(/Linux/)) {
      return EPlatform.LINUX
    } else {
      return EPlatform.DESKTOP_OTHER
    }
  }
}
