import { Injectable } from "@angular/core"
import { MainStore } from "../store/main.store"

export const ANNOUNCEMENT_TIMEOUT = 5000

@Injectable({
  providedIn: "root",
})
export class AnnouncerService {
  constructor(private readonly mainStore: MainStore) {}

  assertive(message: string) {
    this.mainStore.announcerMessage.set({ text: message, type: "assertive" })
    setTimeout(() => {
      this.mainStore.announcerMessage.set(null)
    }, ANNOUNCEMENT_TIMEOUT)
  }

  polite(message: string) {
    this.mainStore.announcerMessage.set({ text: message, type: "polite" })
    setTimeout(() => {
      this.mainStore.announcerMessage.set(null)
    }, ANNOUNCEMENT_TIMEOUT)
  }

  clear() {
    this.mainStore.announcerMessage.set(null)
  }
}
