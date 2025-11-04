import { Component, inject, input } from "@angular/core"
import { MainStore } from "../../store/main.store"
import { toObservable } from "@angular/core/rxjs-interop"
import { AsyncPipe } from "@angular/common"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"

export type AnnouncerMessage = {
  text: string
  type: "polite" | "assertive"
}

@Component({
  selector: "app-announcer",
  imports: [AsyncPipe, TranslatePipe],
  templateUrl: "./announcer.component.html",
})
export class AnnouncerComponent {
  message$ = toObservable(inject(MainStore).announcerMessage)
}
