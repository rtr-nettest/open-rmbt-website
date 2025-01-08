import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from "@angular/core"
import { BehaviorSubject } from "rxjs"
import { IHistoryRowRTR } from "../../../history/interfaces/history-row.interface"
import { ISort } from "../../../tables/interfaces/sort.interface"
import { ITableColumn } from "../../../tables/interfaces/table-column.interface"
import { MessageService } from "../../../shared/services/message.service"
import { Router } from "@angular/router"
import { HistoryStore } from "../../../history/store/history.store"
import { TestStore } from "../../store/test.store"
import { ERoutes } from "../../../shared/constants/routes.enum"
import { THIS_INTERRUPTS_ACTION } from "../../constants/strings"
import { AsyncPipe, NgIf } from "@angular/common"
import { TableComponent } from "../../../tables/components/table/table.component"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { TestService } from "../../services/test.service"

@Component({
  selector: "app-recent-history",
  templateUrl: "./recent-history.component.html",
  styleUrls: ["./recent-history.component.scss"],
  standalone: true,
  imports: [AsyncPipe, NgIf, TableComponent, TranslatePipe],
})
export class RecentHistoryComponent implements OnChanges {
  @Input({ required: true }) result!: {
    content: IHistoryRowRTR[]
    totalElements: number
  }
  @Input() grouped?: boolean
  @Input() title?: string
  @Input() excludeColumns?: string[]
  @Input() interruptsTests = false
  @Output() sortChange: EventEmitter<ISort> = new EventEmitter()
  columns: ITableColumn<IHistoryRowRTR>[] = (() => {
    let cols: ITableColumn<IHistoryRowRTR>[] = []
    cols = [
      {
        columnDef: "count",
        header: "#",
        transformValue(value) {
          return value.groupHeader ? "" : value.count
        },
      },
      {
        columnDef: "measurementDate",
        header: "Time",
      },
      {
        columnDef: "download",
        header: "Download",
        isHtml: true,
      },
      {
        columnDef: "upload",
        header: "Upload",
        isHtml: true,
      },
      {
        columnDef: "ping",
        header: "Ping",
        isHtml: true,
      },
      {
        columnDef: "details",
        header: "",
        // TODO: isComponent: true, what component?
      },
    ]
    return cols.filter((c) => !this.excludeColumns?.includes(c.columnDef))
  })()

  sort$!: BehaviorSubject<ISort>
  tableClassNames?: string[]
  freshlyLoaded = true

  constructor(
    private message: MessageService,
    private store: HistoryStore,
    private testService: TestService
  ) {
    this.sort$ = this.store.historySort$
  }

  ngOnChanges(): void {
    const firstItem = this.result.content[0]
    if (this.grouped && firstItem?.groupHeader && this.freshlyLoaded) {
      this.freshlyLoaded = false
      this.store.openLoops$.next([])
      this.toggleLoopResults(firstItem.id!)
    }
  }

  changeSort = (sort: ISort) => {
    this.sortChange.emit(sort)
  }

  toggleLoopResults(loopUuid: string) {
    if (!loopUuid.startsWith("L")) {
      const navFunc = () => {
        this.testService.abortMeasurement()
        this.testService.disableLoopMode()
        // TODO: navigate to result page
        // this.router.navigateByUrl(
        //   "/" + ERoutes.RESULT.replace(":testUuid", loopUuid)
        // )
      }
      if (this.interruptsTests) {
        this.message.openConfirmDialog(THIS_INTERRUPTS_ACTION, navFunc, {
          canCancel: true,
        })
      } else {
        navFunc()
      }
      return
    }
    const openLoops = this.store.openLoops$.value
    const index = openLoops.indexOf(loopUuid)
    if (index >= 0) {
      openLoops.splice(index, 1)
      this.store.openLoops$.next(openLoops)
    } else {
      this.store.openLoops$.next([...openLoops, loopUuid])
    }
  }
}
