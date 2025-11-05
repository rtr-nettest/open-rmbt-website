import { Injectable } from "@angular/core"
import { MainStore } from "../store/main.store"
import { AnnouncerMessage } from "../components/announcer/announcer.component"

export const ANNOUNCEMENT_TIMEOUT = 5000

@Injectable({
  providedIn: "root",
})
export class AnnouncerService {
  private announcedMessage: string | null = null

  constructor(private readonly mainStore: MainStore) {}

  assertive(message: string) {
    this.announce({ text: message, type: "assertive" })
  }

  polite(message: string) {
    this.announce({ text: message, type: "polite" })
  }

  private announce(message: AnnouncerMessage) {
    if (this.announcedMessage === message.text) {
      return
    }
    this.mainStore.announcerMessage.set(message)
    setTimeout(() => {
      this.mainStore.announcerMessage.set(null)
      this.announcedMessage = null
    }, ANNOUNCEMENT_TIMEOUT)
    this.announcedMessage = message.text
  }

  clear() {
    this.mainStore.announcerMessage.set(null)
  }
}
