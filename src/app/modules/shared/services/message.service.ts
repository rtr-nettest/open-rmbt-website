import { Injectable, NgZone } from "@angular/core"
import { MatSnackBar } from "@angular/material/snack-bar"
import { MatDialog } from "@angular/material/dialog"
import { I18nStore } from "../../i18n/store/i18n.store"
import {
  ConfirmDialogComponent,
  ConfirmDialogOpts,
} from "../components/confirm-dialog/confirm-dialog.component"

@Injectable({
  providedIn: "root",
})
export class MessageService {
  constructor(
    private snackbar: MatSnackBar,
    private dialog: MatDialog,
    private ngZone: NgZone,
    private i18nStore: I18nStore
  ) {}

  closeAllDialogs() {
    this.dialog.closeAll()
  }

  openSnackbar(text: string) {
    this.ngZone.run(() => {
      this.snackbar.open(this.i18nStore.translate(text), undefined, {
        duration: 3000,
        panelClass: ["app-snackbar"],
      })
    })
  }

  openConfirmDialog(
    text: string,
    onConfirm: () => void,
    options?: ConfirmDialogOpts
  ) {
    this.ngZone.run(() => {
      this.dialog
        .open(ConfirmDialogComponent, {
          data: {
            text,
            ...options,
          },
        })
        .afterClosed()
        .subscribe((result) => {
          if (result?.confirmAction) {
            onConfirm()
          }
        })
    })
  }
}
