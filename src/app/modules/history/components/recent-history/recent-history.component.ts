import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from "@angular/core"
import {
  IHistoryGroupItem,
  IHistoryRow,
} from "../../../history/interfaces/history-row.interface"
import { ISort } from "../../../tables/interfaces/sort.interface"
import { ITableColumn } from "../../../tables/interfaces/table-column.interface"
import { MessageService } from "../../../shared/services/message.service"
import { HistoryStore } from "../../../history/store/history.store"
import { DatePipe, NgIf } from "@angular/common"
import { TableComponent } from "../../../tables/components/table/table.component"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { TestService } from "../../../test/services/test.service"
import { THIS_INTERRUPTS_ACTION } from "../../../test/constants/strings"
import { ISimpleHistoryResult } from "../../interfaces/simple-history-result.interface"
import { I18nStore, Translation } from "../../../i18n/store/i18n.store"
import { ClassificationService } from "../../../shared/services/classification.service"
import { roundToSignificantDigits } from "../../../shared/util/math"
import { ExpandArrowComponent } from "../../../shared/components/expand-arrow/expand-arrow.component"
import { Router } from "@angular/router"
import { ERoutes } from "../../../shared/constants/routes.enum"

@Component({
  selector: "app-recent-history",
  templateUrl: "./recent-history.component.html",
  styleUrls: ["./recent-history.component.scss"],
  standalone: true,
  imports: [NgIf, TableComponent, TranslatePipe],
})
export class RecentHistoryComponent implements OnChanges {
  @Input({ required: true }) set result(result: {
    content: Array<ISimpleHistoryResult & IHistoryGroupItem>
    totalElements: number
  }) {
    this.data = {
      content: result.content.map(
        this.historyItemToRow(
          this.i18nStore.translations,
          this.store.openLoops$.value
        )
      ),
      totalElements: result.totalElements,
    }
  }
  @Input() grouped?: boolean
  @Input() title?: string
  @Input() excludeColumns?: string[]
  @Input() interruptsTests = false
  @Output() sortChange: EventEmitter<ISort> = new EventEmitter()
  columns: ITableColumn<IHistoryRow>[] = (() => {
    let cols: ITableColumn<IHistoryRow>[] = []
    cols = [
      {
        columnDef: "device",
        header: "Device",
      },
      {
        columnDef: "networkType",
        header: "Access",
      },
      {
        columnDef: "measurementDate",
        header: "Time",
      },
      {
        columnDef: "down",
        key: "download",
        header: "Download",
        isHtml: true,
      },
      {
        columnDef: "up",
        key: "upload",
        header: "Upload",
        isHtml: true,
      },
      {
        columnDef: "latency",
        key: "ping",
        header: "Ping",
        isHtml: true,
      },
    ]
    return cols.filter((c) => !this.excludeColumns?.includes(c.columnDef))
  })()
  data!: {
    content: IHistoryRow[]
    totalElements: number
  }
  tableClassNames?: string[]
  freshlyLoaded = true

  get sort() {
    return this.store.sort()
  }

  constructor(
    private classification: ClassificationService,
    private datePipe: DatePipe,
    private i18nStore: I18nStore,
    private message: MessageService,
    private router: Router,
    private store: HistoryStore,
    private testService: TestService
  ) {}

  ngOnChanges(): void {
    const firstItem = this.data.content[0]
    if (this.grouped && firstItem?.groupHeader && this.freshlyLoaded) {
      this.freshlyLoaded = false
      this.store.openLoops$.next([])
      this.toggleLoopResults(firstItem.id!)
    }
  }

  changeSort = (sort: ISort) => {
    this.sortChange.emit(sort)
  }

  handleRowClick = (row: IHistoryRow) => {
    if (!row.id?.startsWith("L")) {
      const navFunc = () => {
        this.testService.abortMeasurement()
        this.testService.disableLoopMode()
        this.router.navigate([this.i18nStore.activeLang, ERoutes.RESULT], {
          queryParams: { test_uuid: row.id, open_test_uuid: row.openUuid },
        })
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
    this.toggleLoopResults(row.id)
  }

  toggleLoopResults(loopUuid: string) {
    const openLoops = this.store.openLoops$.value
    const index = openLoops.indexOf(loopUuid)
    if (index >= 0) {
      openLoops.splice(index, 1)
      this.store.openLoops$.next(openLoops)
    } else {
      this.store.openLoops$.next([...openLoops, loopUuid])
    }
  }

  private historyItemToRow =
    (t: Translation, openLoops: string[]) =>
    (hi: ISimpleHistoryResult & IHistoryGroupItem): IHistoryRow => {
      const locale = this.i18nStore.activeLang
      const measurementDate = this.datePipe.transform(
        hi.measurementDate,
        "medium",
        undefined,
        locale
      )!
      if (hi.groupHeader) {
        return {
          id: hi.loopUuid!,
          measurementDate,
          groupHeader: hi.groupHeader,
          details: ExpandArrowComponent,
          componentField: "details",
          parameters: {
            expanded: openLoops.includes(hi.loopUuid!),
          },
        }
      }
      const down = roundToSignificantDigits(hi.download?.value || 0)
      const up = roundToSignificantDigits(hi.upload?.value || 0)
      const ping = hi.ping?.value
      return {
        ...hi,
        openUuid: hi.openTestResponse?.["openTestUuid"],
        device: hi.openTestResponse?.["device"],
        networkType: hi.openTestResponse?.["networkType"],
        measurementDate,
        download:
          this.classification.getPhaseIconByClass(
            "down",
            hi.download?.classification
          ) +
          down.toLocaleString(locale) +
          " " +
          t["Mbps"],
        upload:
          this.classification.getPhaseIconByClass(
            "up",
            hi.upload?.classification
          ) +
          up.toLocaleString(locale) +
          " " +
          t["Mbps"],
        ping:
          this.classification.getPhaseIconByClass(
            "ping",
            hi.ping?.classification
          ) +
          ping?.toLocaleString(locale) +
          " " +
          t["millis"],
      }
    }
}
