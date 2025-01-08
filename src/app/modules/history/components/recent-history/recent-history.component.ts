import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from "@angular/core"
import {
  IHistoryGroupItem,
  IHistoryRowRTR,
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

@Component({
  selector: "app-recent-history",
  templateUrl: "./recent-history.component.html",
  styleUrls: ["./recent-history.component.scss"],
  standalone: true,
  imports: [NgIf, TableComponent, TranslatePipe],
})
export class RecentHistoryComponent implements OnChanges {
  @Input({ required: true }) set result(result: {
    content: ISimpleHistoryResult[]
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
  columns: ITableColumn<IHistoryRowRTR>[] = (() => {
    let cols: ITableColumn<IHistoryRowRTR>[] = []
    cols = [
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
    ]
    return cols.filter((c) => !this.excludeColumns?.includes(c.columnDef))
  })()
  data!: {
    content: IHistoryRowRTR[]
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

  private historyItemToRow =
    (t: Translation, openLoops: string[]) =>
    (hi: ISimpleHistoryResult & IHistoryGroupItem): IHistoryRowRTR => {
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
        id: hi.testUuid!,
        count: hi.count,
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
        loopUuid: hi.loopUuid,
        hidden: hi.hidden,
      }
    }
}
