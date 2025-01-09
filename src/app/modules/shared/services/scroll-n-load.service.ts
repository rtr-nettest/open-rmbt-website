import { WritableSignal } from "@angular/core"
import { IPaginator } from "../../tables/interfaces/paginator.interface"

export class ScrollNLoadService {
  loading = true
  private allLoaded = false

  constructor(
    private readonly loadFn: () => Promise<any>,
    private readonly paginator: WritableSignal<IPaginator>,
    private readonly listLimit: number
  ) {}

  async load(options?: { reset: boolean }) {
    if (options?.reset) {
      this.allLoaded = false
    }
    if (this.allLoaded) {
      return
    }
    this.loading = true
    try {
      const list = await this.loadFn()
      if (!list || !list.length || list.length % this.listLimit > 0) {
        this.allLoaded = true
      }
    } finally {
      this.loading = false
    }
  }

  onScroll(event: any) {
    if (this.loading || this.allLoaded) {
      return
    }
    const scrollHeight = event.target.scrollHeight
    const scrollTop = event.target.scrollTop
    const clientHeight = event.target.clientHeight
    if (scrollTop + clientHeight >= scrollHeight) {
      this.paginator.set({
        offset: this.paginator().offset + this.listLimit,
        limit: this.listLimit,
      })
      this.load()
    }
  }
}
