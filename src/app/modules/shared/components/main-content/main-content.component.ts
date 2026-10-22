import { Component, ChangeDetectionStrategy } from "@angular/core"

@Component({
  selector: "app-main-content",
  imports: [],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<main id="mainContent" role="main">
    <ng-content></ng-content>
  </main>`,
})
export class MainContentComponent {}
