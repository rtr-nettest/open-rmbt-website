import { Component, HostListener, signal } from "@angular/core"
import { SeoComponent } from "../seo/seo.component"

@Component({
    selector: "app-load-on-scroll",
    imports: [],
    template: ""
})
export class LoadOnScrollComponent extends SeoComponent {
  loading = signal(true)
  private allLoaded = signal(false)

  protected get dataLimit() {
    return -1
  }

  protected async fetchData(): Promise<Array<any>> {
    throw new Error("Method not implemented.")
  }

  protected async updateData(options?: { reset: boolean }) {
    let retVal: Array<any> = []
    if (options?.reset) {
      this.allLoaded.set(false)
    }
    if (this.allLoaded()) {
      return retVal
    }
    this.loading.set(true)
    try {
      retVal = await this.fetchData()
      if (!retVal || !retVal.length || retVal.length % this.dataLimit > 0) {
        this.allLoaded.set(true)
      }
    } finally {
      this.loading.set(false)
    }
    return retVal
  }

  protected disableOnScroll() {
    this.allLoaded.set(true)
  }

  @HostListener("body:scroll", ["$event"])
  private onScroll(event: any) {
    if (this.loading() || this.allLoaded()) {
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
