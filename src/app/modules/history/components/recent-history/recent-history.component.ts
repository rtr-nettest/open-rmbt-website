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
import { HistoryStore } from "../../../history/store/history.store"
import { DatePipe, NgIf } from "@angular/common"
import { TableComponent } from "../../../tables/components/table/table.component"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { TestService } from "../../../test/services/test.service"
import { ISimpleHistoryResult } from "../../interfaces/simple-history-result.interface"
import { I18nStore, Translation } from "../../../i18n/store/i18n.store"
import { ClassificationService } from "../../../shared/services/classification.service"
import { roundToSignificantDigits } from "../../../shared/util/math"
import { Router } from "@angular/router"
import { ERoutes } from "../../../shared/constants/routes.enum"
import { LoopService } from "../../../loop/services/loop.service"

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
        this.historyItemToRow(this.i18nStore.translations)
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
      {
        columnDef: "groupArrowIndicator",
        header: "",
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

  get expandedElements() {
    return this.store.openLoops$.value
  }

  get sort() {
    return this.store.sort()
  }

  constructor(
    private classification: ClassificationService,
    private datePipe: DatePipe,
    private i18nStore: I18nStore,
    private router: Router,
    private store: HistoryStore
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
      // navigation to one of the loop results
      this.router.navigate([this.i18nStore.activeLang, ERoutes.RESULT], {
        queryParams: { test_uuid: row.id },
      })
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
    (t: Translation) =>
    (hi: ISimpleHistoryResult & IHistoryGroupItem): IHistoryRow => {
      const locale = this.i18nStore.activeLang
      const measurementDate = this.datePipe.transform(
        hi.measurementDate,
        "dd.MM.YYYY, HH:mm:ss"
      )!
      if (hi.groupHeader) {
        return {
          id: hi.loopUuid!,
          measurementDate,
          device: hi.openTestResponse?.["device"],
          networkType: hi.openTestResponse?.["networkType"],
          groupHeader: hi.groupHeader,
          download: " ",
          upload: " ",
          ping: " ",
        }
      }
      const down = roundToSignificantDigits(hi.download?.value || 0)
      const up = roundToSignificantDigits(hi.upload?.value || 0)
      const ping = hi.ping?.value
      return {
        ...hi,
        id: hi.testUuid,
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
