import { Directive, ElementRef, Renderer2, effect, input } from "@angular/core"

@Directive({
  selector: "[appPendingButton]",
  standalone: true,
})
export class PendingButtonDirective {
  appPendingButton = input(false)

  constructor(
    private readonly _el: ElementRef,
    private readonly _renderer: Renderer2
  ) {
    effect(() => {
      if (!this.appPendingButton()) {
        this._renderer.removeClass(this._el.nativeElement, "app-pending-button")
        this._renderer.setProperty(this._el.nativeElement, "disabled", false)
      } else {
        this._renderer.addClass(this._el.nativeElement, "app-pending-button")
        this._renderer.setProperty(this._el.nativeElement, "disabled", true)
      }
    })
  }
}
