import { Component, Inject, model, signal } from "@angular/core"
import { MatButtonModule } from "@angular/material/button"
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog"
import { MatIconModule } from "@angular/material/icon"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { MatFormFieldModule } from "@angular/material/form-field"
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms"
import { HistoryService } from "../../services/history.service"
import { MatInputModule } from "@angular/material/input"
import { CloseDialogHeaderComponent } from "../../../shared/components/close-dialog-header/close-dialog-header.component"
import { catchError, finalize, of } from "rxjs"
import { MainStore } from "../../../shared/store/main.store"


@Component({
  selector: "app-sync-dialog",
  imports: [
    CloseDialogHeaderComponent,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    ReactiveFormsModule,
    TranslatePipe
],
  templateUrl: "./sync-dialog.component.html",
  styleUrl: "./sync-dialog.component.scss",
})
export class SyncDialogComponent {
  form!: FormGroup
  code = signal<string | null>(null)
  error = signal<string | null>(null)
  text = signal<string | null>(null)
  showForm = model<boolean>(false)

  constructor(
    @Inject(MAT_DIALOG_DATA) private readonly data: any,
    readonly dialogRef: MatDialogRef<SyncDialogComponent>,
    private readonly fb: FormBuilder,
    private readonly historyService: HistoryService,
    private readonly mainStore: MainStore
  ) {
    this.form = this.fb.group({
      code: this.fb.control("", Validators.required),
    })
  }

  requestCode() {
    this.mainStore.inProgress$.next(true)
    this.historyService
      .syncHistory(null)
      .pipe(
        catchError((err) => {
          this.error.set(err.message)
          return of(null)
        }),
        finalize(() => {
          this.mainStore.inProgress$.next(false)
        })
      )
      .subscribe((code) => {
        this.code.set(code)
      })
  }

  submitCode() {
    this.mainStore.inProgress$.next(true)
    this.historyService
      .syncHistory(this.form.get("code")!.value)
      .pipe(
        catchError((err) => {
          this.error.set(err.message)
          return of(null)
        }),
        finalize(() => {
          this.mainStore.inProgress$.next(false)
        })
      )
      .subscribe((text) => {
        this.text.set(text)
        this.data?.onSync?.()
      })
  }

  close() {
    this.dialogRef.close()
  }
}
