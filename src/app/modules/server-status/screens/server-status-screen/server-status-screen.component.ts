import { Component, computed, inject, OnInit, signal } from "@angular/core"
import { AsyncPipe } from "@angular/common"
import { catchError, finalize, map, Observable, of } from "rxjs"
import { SeoComponent } from "../../../shared/components/seo/seo.component"
import { HeaderComponent } from "../../../shared/components/header/header.component"
import { TopNavComponent } from "../../../shared/components/top-nav/top-nav.component"
import { FooterComponent } from "../../../shared/components/footer/footer.component"
import { BreadcrumbsComponent } from "../../../shared/components/breadcrumbs/breadcrumbs.component"
import { MainContentComponent } from "../../../shared/components/main-content/main-content.component"
import { LoadingOverlayComponent } from "../../../shared/components/loading-overlay/loading-overlay.component"
import { TableComponent } from "../../../tables/components/table/table.component"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { ITableColumn } from "../../../tables/interfaces/table-column.interface"
import { ISort } from "../../../tables/interfaces/sort.interface"
import { IBasicResponse } from "../../../tables/interfaces/basic-response.interface"
import { ServerStatusService } from "../../services/server-status.service"
import { IServerStatus } from "../../interfaces/server-status.interface"
import { roundMs } from "../../../shared/util/math"

@Component({
  selector: "app-server-status-screen",
  imports: [
    AsyncPipe,
    BreadcrumbsComponent,
    HeaderComponent,
    TopNavComponent,
    FooterComponent,
    MainContentComponent,
    LoadingOverlayComponent,
    TableComponent,
    TranslatePipe,
  ],
  templateUrl: "./server-status-screen.component.html",
  styleUrl: "./server-status-screen.component.scss",
})
export class ServerStatusScreenComponent extends SeoComponent implements OnInit {
  private readonly service = inject(ServerStatusService)

  loading = signal(false)
  servers = signal<IServerStatus[] | undefined>(undefined)

  data = computed<IBasicResponse<IServerStatus> | undefined>(() => {
    const servers = this.servers()
    if (!servers) {
      return undefined
    }
    const content = [...servers].sort((a, b) => {
      // unreachable first so issues stand out, then by name and protocol
      if (a.reachable !== b.reachable) {
        return a.reachable ? 1 : -1
      }
      return a.name.localeCompare(b.name) || a.protocol - b.protocol
    })
    return { content, totalElements: content.length }
  })

  reachableCount = computed(
    () => this.servers()?.filter((s) => s.reachable).length ?? 0
  )
  totalCount = computed(() => this.servers()?.length ?? 0)
  allReachable = computed(
    () => !!this.servers() && this.reachableCount() === this.totalCount()
  )

  sort: ISort = { active: "name", direction: "asc" }

  columns: ITableColumn<IServerStatus>[] = [
    {
      header: "Status",
      columnDef: "reachable",
      getIconClass: (server) =>
        server.reachable
          ? "fa-solid fa-circle-check app-server-status--online"
          : "fa-solid fa-circle-xmark app-server-status--offline",
      transformValue: (server) =>
        this.i18nStore.translate(server.reachable ? "Online" : "Offline"),
      getNgClass: (server) =>
        server && server.reachable
          ? "app-server-status--online"
          : "app-server-status--offline",
    },
    {
      header: "Server",
      columnDef: "name",
    },
    {
      header: "Type",
      columnDef: "server_type",
    },
    {
      header: "IP version",
      columnDef: "protocol",
      transformValue: (server) => `IPv${server.protocol}`,
    },
    {
      header: "Ping (ms)",
      columnDef: "latency_ms",
      transformValue: (server) => roundMs(server.latency_ms),
      justify: "flex-end",
    },
    {
      header: "Min (ms)",
      columnDef: "min_latency_ms",
      transformValue: (server) => roundMs(server.min_latency_ms),
      justify: "flex-end",
    },
    {
      header: "Max (ms)",
      columnDef: "max_latency_ms",
      transformValue: (server) => roundMs(server.max_latency_ms),
      justify: "flex-end",
    },
    {
      header: "Reachability",
      columnDef: "reachability_pct",
      transformValue: (server) => `${server.reachability_pct} %`,
      justify: "flex-end",
    },
  ]

  serverStatus$!: Observable<IServerStatus[] | undefined>

  ngOnInit(): void {
    this.loading.set(true)
    this.serverStatus$ = this.service.getServerStatus().pipe(
      map((servers) => {
        this.servers.set(servers)
        return servers
      }),
      catchError(() => {
        this.servers.set([])
        return of([] as IServerStatus[])
      }),
      finalize(() => this.loading.set(false))
    )
  }
}
