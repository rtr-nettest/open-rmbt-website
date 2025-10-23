import { Component } from "@angular/core"

@Component({
  selector: "app-main-content",
  imports: [],
  template: `<main id="mainContent" role="main">
    <ng-content></ng-content>
  </main>`,
})
export class MainContentComponent {}
