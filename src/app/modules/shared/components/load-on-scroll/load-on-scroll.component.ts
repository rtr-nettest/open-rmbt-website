import { Component, Host, HostListener } from "@angular/core"
import { SeoComponent } from "../seo/seo.component"

@Component({
  selector: "app-load-on-scroll",
  standalone: true,
  imports: [],
  template: "",
})
export class LoadOnScrollComponent extends SeoComponent {
  loading = true
  private allLoaded = false

  protected get dataLimit() {
    return -1
  }

  protected async fetchData(): Promise<Array<any>> {
    throw new Error("Method not implemented.")
  }

  protected async updateData(options?: { reset: boolean }) {
    let retVal: Array<any> = []
    if (options?.reset) {
      this.allLoaded = false
    }
    if (this.allLoaded) {
      return retVal
    }
    this.loading = true
    try {
      retVal = await this.fetchData()
      if (!retVal || !retVal.length || retVal.length % this.dataLimit > 0) {
        this.allLoaded = true
      }
    } finally {
      this.loading = false
    }
    return retVal
  }

  protected disableOnScroll() {
    this.allLoaded = true
  }

  @HostListener("body:scroll", ["$event"])
  private onScroll(event: any) {
    if (this.loading || this.allLoaded) {
      return
    }
    const scrollHeight = event.target.scrollHeight
    const scrollTop = event.target.scrollTop
    const clientHeight = event.target.clientHeight
    if (scrollTop + clientHeight >= scrollHeight) {
      this.updateData()
    }
  }
}
