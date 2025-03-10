import { Component, OnDestroy } from "@angular/core"
import { MatDialogModule, MatDialogRef } from "@angular/material/dialog"
import { MatIconModule } from "@angular/material/icon"
import { Subject, takeUntil } from "rxjs"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from "@angular/forms"
import { MapStoreService } from "../../store/map-store.service"
import { EBasemapType } from "../../constants/basemap-type.enum"
import { I18nStore } from "../../../i18n/store/i18n.store"
import { MatRadioModule } from "@angular/material/radio"
import { MatButtonModule } from "@angular/material/button"
import { CloseDialogHeaderComponent } from "../../../shared/components/close-dialog-header/close-dialog-header.component"

type BasemapPickerForm = {
  basemap: FormControl<string | null>
}

@Component({
  selector: "app-basemap-picker",
  imports: [
    CloseDialogHeaderComponent,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatRadioModule,
    ReactiveFormsModule,
    TranslatePipe,
  ],
  templateUrl: "./basemap-picker.component.html",
  styleUrl: "./basemap-picker.component.scss",
})
export class BasemapPickerComponent implements OnDestroy {
  destroyed$ = new Subject<void>()
  form!: FormGroup<BasemapPickerForm>
  options!: { value: string; label: string }[]

  constructor(
    public readonly dialogRef: MatDialogRef<BasemapPickerComponent>,
    private readonly fb: FormBuilder,
    private readonly i18nStore: I18nStore,
    private readonly store: MapStoreService
  ) {
    this.options = Object.values(EBasemapType)
      .filter((value) => value !== EBasemapType.OSM)
      .map((value) => ({
        value,
        label: this.i18nStore.translate(value),
      }))
    this.form = this.fb.group({
      basemap: new FormControl<string | null>(
        this.store.basemap() || EBasemapType.BMAPGRAU
      ),
    })
    this.form.valueChanges.pipe(takeUntil(this.destroyed$)).subscribe(() => {
      this.applyFilters()
    })
  }

  ngOnDestroy(): void {
    this.destroyed$.next()
    this.destroyed$.complete()
  }

  applyFilters() {
    this.store.basemap.set(this.form.controls.basemap.value)
  }

  close() {
    this.dialogRef.close()
  }
}
