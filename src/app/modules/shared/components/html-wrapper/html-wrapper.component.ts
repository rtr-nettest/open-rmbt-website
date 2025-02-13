import { Component, Input } from "@angular/core"

@Component({
    selector: "app-html-wrapper",
    imports: [],
    templateUrl: "./html-wrapper.component.html",
    styleUrl: "./html-wrapper.component.scss"
})
export class HtmlWrapperComponent {
  @Input() id = ""
  @Input({ required: true }) set html(value: string | null) {
    if (!value) {
      return
    }
    const parts = value.split("<body>")
    this.headerHtml = parts[0]
    const bodyParts = parts[1].split("</body>")
    this.bodyHtml = bodyParts[0]
    this.footerHtml = bodyParts[1]
  }
  headerHtml = ""
  bodyHtml = ""
  footerHtml = ""
}
