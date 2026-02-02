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
import { DatePipe } from "@angular/common";
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
import { ChartPhase } from "../../../charts/dto/test-chart-dataset"

@Component({
  selector: "app-recent-history",
  templateUrl: "./recent-history.component.html",
  styleUrls: ["./recent-history.component.scss"],
  imports: [TableComponent, TranslatePipe],
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
        columnDef: "groupArrowIndicator",
        header: "",
      },
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
      if (this.interruptsTests()) {
        window.open(
          `${window.location.origin}/${this.i18nStore.activeLang}/${ERoutes.RESULT}?test_uuid=${row.id}`,
          "_blank"
        )
      } else {
        this.router.navigate([this.i18nStore.activeLang, ERoutes.RESULT], {
          queryParams: { test_uuid: row.id },
        })
      }
      return
    }
    this.toggleLoopResults(row.id)
  }

  handleRowShiftClick = (row: IHistoryRow) => {
    if (row.id?.startsWith("L")) {
      this.toggleLoopResults(row.id)
      return
    }
    window.open(
      `${window.location.origin}/${this.i18nStore.activeLang}/${ERoutes.RESULT}?test_uuid=${row.id}`,
      "_blank"
    )
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
      if (hi.groupHeader) {
        return {
          id: hi.loopUuid!,
          device: " ",
          measurementDate: hi.measurementDate,
          networkType: hi.openTestResponse?.["networkType"],
          groupHeader: hi.groupHeader,
          download: " ",
          upload: " ",
          ping: " ",
        }
      }
      const down =
        hi.download?.value != null
          ? roundToSignificantDigits(hi.download?.value)
          : null
      const up =
        hi.upload?.value != null
          ? roundToSignificantDigits(hi.upload?.value)
          : null
      const ping =
        hi.ping?.value != null ? roundToSignificantDigits(hi.ping?.value) : null
      return {
        ...hi,
        id: hi.testUuid,
        openUuid: hi.openTestResponse?.["openTestUuid"],
        device: hi.openTestResponse?.["device"],
        networkType: hi.openTestResponse?.["networkType"],
        intValues:
          hi.openTestResponse?.["status"] == "finished"
            ? {
                download: (hi.download?.value || 0) * 1000,
                upload: (hi.upload?.value || 0) * 1000,
                ping: hi.ping?.value || 0,
              }
            : undefined,
        download:
          down == null
            ? " "
            : this.getHtmlValueByColumnName(down, {
                klass: hi.download?.classification || 0,
                phase: "down",
                units: "Mbps",
              }),
        upload: this.getHtmlValueByColumnName(up, {
          klass: hi.upload?.classification || 0,
          phase: "up",
          units: "Mbps",
        }),
        ping:
          ping == null
            ? " "
            : this.getHtmlValueByColumnName(ping, {
                klass: hi.ping?.classification || 0,
                phase: "ping",
                units: "millis",
              }),
      }
    }

  private getHtmlValueByColumnName(
    value: number | null,
    options: {
      klass: number
      phase: Phase
      units: "Mbps" | "millis"
    }
  ) {
    if (value === null) {
      return this.i18nStore.translate("Test failed")
    }
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
    const medianForField = (field: ChartPhase) =>
      median(
        data.content
          .filter(
            (c) =>
              c.intValues?.[field] != undefined && c.intValues?.[field] != null
          )
          .map((c) => c.intValues?.[field] || 0)
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
