import { Component, Input } from "@angular/core"
import { IDynamicComponent } from "../../../shared/interfaces/dynamic-component.interface"
import { ISimpleHistorySignal } from "../../interfaces/simple-history-result.interface"
import { I18nStore } from "../../../i18n/store/i18n.store"
import { ERoutes } from "../../../shared/constants/routes.enum"

@Component({
  selector: "app-cell-info",
  standalone: true,
  imports: [],
  templateUrl: "./cell-info.component.html",
  styleUrl: "./cell-info.component.scss",
})
export class CellInfoComponent
  implements IDynamicComponent<ISimpleHistorySignal>
{
  @Input() set parameters(value: ISimpleHistorySignal) {
    this.rows = []
    this.makeSignalInfo(value)
    this.makeCellInfo(value)
  }
  rows: string[] = []

  constructor(private readonly i18nStore: I18nStore) {}

  private addItem(
    value: any,
    abbr: string,
    title?: string,
    searchParameter?: string
  ) {
    let ret = ""
    if (value) {
      if (searchParameter) {
        ret = `<a href='/${this.i18nStore.activeLang}/${ERoutes.OPEN_DATA}?${searchParameter}=${value}'>${value}</a>`
      } else {
        ret = value
      }

      if (title) {
        ret = "<abbr title='" + title + "'>" + abbr + "</abbr>: " + ret + ", "
      } else {
        ret = abbr + ": " + value + ", "
      }
    }

    return ret
  }

  private makeCellInfo5G(ci: any) {
    let string = "5G: "
    string += this.addItem(
      ci.nci,
      "NCI",
      "New Radio Cell Identity",
      "cell_location_id"
    )
    string += this.addItem(
      ci.pci,
      "PCI",
      "Tracking Area Code",
      "cell_area_code"
    )
    string += this.addItem(ci.tac, "TAC", "Physical Cell Id")
    string += this.addItem(
      ci.nrarfcn,
      "NRARFCN",
      "New Radio Absolute Radio Frequency Channel Number"
    )
    if (ci.frequency_dl) {
      string += this.addItem(
        ci.frequency_dl + "&nbsp;MHz",
        "Freq",
        "Frequency (DL)"
      )
    }
    string += this.addItem(ci.band, "Band")

    if (string.length > 0) {
      string = string.substring(0, string.length - 1)
    }
    return string
  }

  //explainatory line
  private makeCellInfo4G(ci: any) {
    let string = "4G: "
    string += this.addItem(ci.ci, "CI", "Cell Identity", "cell_location_id")
    string += this.addItem(
      ci.tac,
      "TAC",
      "Tracking Area Code",
      "cell_area_code"
    )
    string += this.addItem(ci.pci, "PCI", "Physical Cell Id")
    string += this.addItem(
      ci.earfcn,
      "EARFCN",
      "Evolved Absolute Radio Frequency Channel Number"
    )
    if (ci.frequency_dl) {
      string += this.addItem(
        ci.frequency_dl + "&nbsp;MHz",
        "Freq",
        "Frequency (DL)"
      )
    }
    string += this.addItem(ci.band, "Band")

    if (string.length > 0) {
      string = string.substring(0, string.length - 1)
    }
    return string
  }

  private makeCellInfo3G(ci: any) {
    let string = "3G: "
    string += this.addItem(ci.cid, "CID", "Cell Identity", "cell_location_id")
    string += this.addItem(
      ci.lac,
      "LAC",
      "Location Area Code",
      "cell_area_code"
    )
    string += this.addItem(ci.psc, "PSC", "Primary Scrambling Code")
    string += this.addItem(
      ci.uarfcn,
      "UARFCN",
      " UTRA Absolute Radio Frequency Channel Number"
    )
    if (ci.frequency_dl) {
      string += this.addItem(
        ci.frequency_dl + "&nbsp;MHz",
        "Freq",
        "Frequency (DL)"
      )
    }
    string += this.addItem(ci.band, "Band")

    if (string.length > 0) {
      string = string.substr(0, string.length - 2)
    }
    return string
  }

  private makeCellInfo2G(ci: any) {
    var string = "2G: "
    string += this.addItem(ci.cid, "CID", " Cell Identity", "cell_location_id")
    string += this.addItem(
      ci.lac,
      "LAC",
      "Location Area Code",
      "cell_area_code"
    )
    string += this.addItem(ci.bsic, "BSIC", "Base Station Identity Code")
    string += this.addItem(
      ci.arfcn,
      "ARFCN",
      "Absolute Radio Frequency Channel Number "
    )
    if (ci.frequency_dl) {
      string += this.addItem(
        ci.frequency_dl + "&nbsp;MHz",
        "Freq",
        "Frequency (DL)"
      )
    }
    string += this.addItem(ci.band, "Band")

    if (string.length > 0) {
      string = string.substring(0, string.length - 1)
    }
    return string
  }

  private makeCellInfo(signal: ISimpleHistorySignal) {
    if (signal.cell_info_2G) {
      this.rows.push(this.makeCellInfo2G(signal.cell_info_2G))
    }
    if (signal.cell_info_3G) {
      this.rows.push(this.makeCellInfo3G(signal.cell_info_3G))
    }
    if (signal.cell_info_4G) {
      this.rows.push(this.makeCellInfo4G(signal.cell_info_4G))
    }
    if (signal.cell_info_5G) {
      this.rows.push(this.makeCellInfo5G(signal.cell_info_5G))
    }
  }

  private makeSignalInfo(signal: ISimpleHistorySignal) {
    const nrNsa = signal.network_type === "NR NSA"
    let signalRow = ""
    if (signal.signal_strength) {
      signalRow +=
        signal.signal_strength + " " + this.i18nStore.translate("dBm")
    }
    if (signal.lte_rsrp) {
      signalRow +=
        signal.lte_rsrp +
        " " +
        this.i18nStore.translate("dB") +
        (nrNsa ? " (4G)" : "")
    }
    if (signal.timing_advance !== null) {
      signalRow += signalRow !== "" ? ", " : ""
      signalRow +=
        "<abbr title='" +
        this.i18nStore.translate("timing_advance") +
        "'>TA</abbr>: " +
        signal.timing_advance
    }
    if (signal.lte_rsrq !== null) {
      signalRow += signalRow !== "" ? ", " : ""
      signalRow +=
        "<abbr title='" +
        this.i18nStore.translate("referenced_signal_received_quality") +
        "'>RSRQ</abbr>" +
        (nrNsa ? " (4G)" : "") +
        ": " +
        signal.lte_rsrq +
        " " +
        this.i18nStore.translate("dB")
    }
    if (signal.lte_snr !== null) {
      signalRow += signalRow !== "" ? ", " : ""
      signalRow +=
        "<abbr title='" +
        this.i18nStore.translate("signal_noise_ratio") +
        "'>SNR</abbr>" +
        (nrNsa ? " (4G)" : "") +
        ": " +
        signal.lte_snr +
        " " +
        this.i18nStore.translate("dB")
    }
    if (signal.nr_rsrp) {
      signalRow += signalRow !== "" ? "<br/>" : ""
      signalRow +=
        signal.nr_rsrp +
        " " +
        this.i18nStore.translate("dB") +
        (nrNsa ? " (5G)" : "")
    }
    if (signal.nr_rsrq !== null) {
      signalRow += signalRow !== "" ? ", " : ""
      signalRow +=
        "<abbr title='" +
        this.i18nStore.translate("referenced_signal_received_quality") +
        "'>RSRQ</abbr>" +
        (nrNsa ? " (5G)" : "") +
        ": " +
        signal.nr_rsrq +
        " " +
        this.i18nStore.translate("dB")
    }
    if (signal.nr_snr !== null) {
      signalRow += signalRow !== "" ? ", " : ""
      signalRow +=
        "<abbr title='" +
        this.i18nStore.translate("signal_noise_ratio") +
        "'>SNR</abbr>" +
        (nrNsa ? " (5G)" : "") +
        ": " +
        signal.nr_snr +
        " " +
        this.i18nStore.translate("dB")
    }
    this.rows.push(signalRow)
  }
}
