import {
  Component,
  computed,
  EventEmitter,
  input,
  Input,
  OnChanges,
  output,
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
import { ISimpleHistoryResult } from "../../interfaces/simple-history-result.interface"
import { I18nStore, Translation } from "../../../i18n/store/i18n.store"
import {
  ClassificationService,
  Phase,
  THRESHOLD_DOWNLOAD,
  THRESHOLD_PING,
  THRESHOLD_UPLOAD,
} from "../../../shared/services/classification.service"
import { median, roundToSignificantDigits } from "../../../shared/util/math"
import { Router } from "@angular/router"
import { ERoutes } from "../../../shared/constants/routes.enum"
import { IBasicResponse } from "../../../tables/interfaces/basic-response.interface"

@Component({
  selector: "app-recent-history",
  templateUrl: "./recent-history.component.html",
  styleUrls: ["./recent-history.component.scss"],
  standalone: true,
  imports: [NgIf, TableComponent, TranslatePipe],
})
export class RecentHistoryComponent implements OnChanges {
  addMedian = input(false)
  result =
    input.required<IBasicResponse<ISimpleHistoryResult & IHistoryGroupItem>>()
  grouped = input(false)
  title = input<string>()
  excludeColumns = input<string[]>()
  interruptsTests = input(false)
  sortChange = output<ISort>()
  columns = computed(() => {
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
    return cols
      .filter((c) => !this.excludeColumns()?.includes(c.columnDef))
      .map((c) => ({
        ...c,
        footer: this.getFooterValueByColumnName(c, this.data()),
      }))
  })
  footerColumns = computed(() =>
    this.addMedian() ? this.columns().map((c) => c.columnDef) : []
  )
  data = computed(() => {
    const result = this.result()
    return {
      content: result.content.map(
        this.historyItemToRow(this.i18nStore.translations)
      ),
      totalElements: result.totalElements,
    }
  })
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
    const firstItem = this.data().content[0]
    if (this.grouped() && firstItem?.groupHeader && this.freshlyLoaded) {
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
        intValues: {
          download: (hi.download?.value || 0) * 1000,
          upload: (hi.upload?.value || 0) * 1000,
          ping: hi.ping?.value || 0,
        },
        download: this.getHtmlValueByColumnName(down, {
          klass: hi.download?.classification || 0,
          phase: "down",
          units: "Mbps",
        }),
        upload: this.getHtmlValueByColumnName(up, {
          klass: hi.upload?.classification || 0,
          phase: "up",
          units: "Mbps",
        }),
        ping: this.getHtmlValueByColumnName(ping || 0, {
          klass: hi.ping?.classification || 0,
          phase: "ping",
          units: "millis",
        }),
      }
    }

  private getHtmlValueByColumnName(
    value: number,
    options: {
      klass: number
      phase: Phase
      units: "Mbps" | "millis"
    }
  ) {
    const { klass, phase, units } = options
    return (
      this.classification.getPhaseIconByClass(phase, klass) +
      value.toLocaleString(this.i18nStore.activeLang) +
      " " +
      this.i18nStore.translate(units)
    )
  }

  private getFooterValueByColumnName(
    col: ITableColumn<IHistoryRow>,
    data: IBasicResponse<IHistoryRow>
  ) {
    const medianForField = (field: "download" | "upload" | "ping") =>
      median(
        data.content.map((c) =>
          c.intValues?.[field] ? c.intValues?.[field] : 0
        )
      )
    let med = 0
    switch (col.columnDef) {
      case "down":
        med = medianForField("download")
        return this.getHtmlValueByColumnName(med / 1000, {
          klass: this.classification.classify(
            med,
            THRESHOLD_DOWNLOAD,
            "biggerBetter"
          ),
          phase: "down",
          units: "Mbps",
        })
      case "up":
        med = medianForField("upload")
        return this.getHtmlValueByColumnName(med / 1000, {
          klass: this.classification.classify(
            med,
            THRESHOLD_UPLOAD,
            "biggerBetter"
          ),
          phase: "up",
          units: "Mbps",
        })
      case "latency":
        med = medianForField("ping")
        return this.getHtmlValueByColumnName(med, {
          klass: this.classification.classify(
            med,
            THRESHOLD_PING,
            "smallerBetter"
          ),
          phase: "ping",
          units: "millis",
        })
      case "device":
        return this.i18nStore.translate("Median")
      default:
        return undefined
    }
  }
}
