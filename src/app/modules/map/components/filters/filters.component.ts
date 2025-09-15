import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  ViewChild,
} from "@angular/core"
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from "@angular/forms"
import { MatRadioModule } from "@angular/material/radio"
import { MatButtonModule } from "@angular/material/button"
import { Observable, Subject } from "rxjs"
import { MatTabGroup, MatTabsModule } from "@angular/material/tabs"
import { IMapInfo } from "../../interfaces/map-info.interface"
import { MatIconModule } from "@angular/material/icon"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { NgIf, NgTemplateOutlet, TitleCasePipe } from "@angular/common"
import { IMapFilter } from "../../interfaces/map-filter.interface"
import { MapStoreService } from "../../store/map-store.service"
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog"
import { ETileTypes } from "../../constants/tile-type.enum"
import { NetworkMeasurementType } from "../../constants/network-measurement-type"
import { FiltersForm } from "../../interfaces/filter-form"
import { GeneralFiltersFormBuilderService } from "../../services/general-filters-form-builder.service"
import { WlanFiltersFormBuilderService } from "../../services/wlan-filters-form-builder.service"
import { BrowserFiltersFormBuilderService } from "../../services/browser-filters-form-builder.service"
import { MobileFiltersFormBuilderService } from "../../services/mobile-filters-form-builder.service"
import { CloseDialogHeaderComponent } from "../../../shared/components/close-dialog-header/close-dialog-header.component"

type ActiveControlGroup =
  | "networkMeasurementType"
  | "tiles"
  | "statisticalOptions"
  | "periodOptions"
  | "technologyOptions"
  | "operatorOptions"
  | "providerOptions"

@Component({
  selector: "app-filters",
  imports: [
    CloseDialogHeaderComponent,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatRadioModule,
    MatTabsModule,
    NgTemplateOutlet,
    NgIf,
    TranslatePipe,
    TitleCasePipe,
  ],
  templateUrl: "./filters.component.html",
  styleUrl: "./filters.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FiltersComponent implements OnDestroy {
  @ViewChild("tabs") tabs: MatTabGroup | undefined
  private readonly fb = inject(FormBuilder)
  activeControlGroup?: ActiveControlGroup
  destroyed$ = new Subject<void>()
  form!: FormGroup<FiltersForm>
  mapTypesTitles = new Map<NetworkMeasurementType, string>()
  tilesTypes = Object.values(ETileTypes)
  filters$!: Observable<IMapInfo>
  statisticalOptions?: IMapFilter
  periodOptions?: IMapFilter
  technologyOptions?: IMapFilter
  operatorOptions?: IMapFilter
  providerOptions?: IMapFilter

  get mapInfo() {
    return this.store.mapInfo
  }

  get showStatistics() {
    return this.form.controls.tiles.value !== ETileTypes.points
  }

  constructor(
    readonly dialogRef: MatDialogRef<FiltersComponent>,
    private readonly store: MapStoreService,
    private readonly generalFB: GeneralFiltersFormBuilderService,
    private readonly wlanFB: WlanFiltersFormBuilderService,
    private readonly browserFB: BrowserFiltersFormBuilderService,
    private readonly mobileFB: MobileFiltersFormBuilderService
  ) {
    for (const networkType of this.mapInfo.get("MAP_TYPE").options ?? []) {
      for (const metric of networkType.options ?? []) {
        if (metric.params?.map_options)
          this.mapTypesTitles.set(
            metric.params?.map_options,
            `${networkType.title}/${metric.title}`
          )
      }
    }
    this.form = this.fb.group({
      networkMeasurementType: new FormControl<NetworkMeasurementType>(
        this.store.filters()!.networkMeasurementType!
      ),
      tiles: new FormControl<ETileTypes>(this.store.filters()!.tiles!),
      filters: this.getFiltersByType(
        this.store.filters()!.networkMeasurementType!
      ),
    })
  }

  ngOnDestroy(): void {
    this.destroyed$.next()
    this.destroyed$.complete()
  }

  close() {
    this.dialogRef.close()
  }

  changeNetworkMeasurementType(v?: NetworkMeasurementType) {
    this.form.controls.networkMeasurementType.setValue(v ?? null)
    this.form.setControl("filters", this.getFiltersByType(v))
  }

  changeTab(index: number, activeControlGroup?: ActiveControlGroup) {
    if (this.tabs) {
      this.tabs.selectedIndex = index
    }
    if (activeControlGroup) {
      this.activeControlGroup = activeControlGroup
    }
  }

  applyFilters() {
    if (this.tabs) {
      this.tabs.selectedIndex = 0
    }
    this.activeControlGroup = undefined
    this.store.filters.set({ ...this.form.value })
  }

  getFilterTitleFromValue(
    filter: IMapFilter,
    field: string,
    value: string | number
  ) {
    return filter.options?.find(
      (o) => (o.params as Record<string, any>)?.[field] === value
    )?.title
  }

  private getFiltersByType(type?: NetworkMeasurementType) {
    this.statisticalOptions = undefined
    this.periodOptions = undefined
    this.technologyOptions = undefined
    this.providerOptions = undefined
    this.operatorOptions = undefined
    if (type?.startsWith("mobile")) {
      this.statisticalOptions = this.mapInfo.get("STATISTICS")
      this.periodOptions = this.mapInfo.get("MAP_FILTER_PERIOD")
      this.technologyOptions = this.mapInfo.get("MAP_FILTER_TECHNOLOGY")
      this.operatorOptions = this.mapInfo.get("MAP_FILTER_CARRIER")
      return this.mobileFB.build(this.mapInfo, this.form)
    } else if (type?.startsWith("wifi")) {
      this.statisticalOptions = this.mapInfo.get("STATISTICS")
      this.periodOptions = this.mapInfo.get("MAP_FILTER_PERIOD")
      this.technologyOptions = this.mapInfo.get("MAP_FILTER_TECHNOLOGY")
      this.providerOptions = this.mapInfo.get("PROVIDER")
      return this.wlanFB.build(this.mapInfo, this.form)
    } else if (type?.startsWith("browser")) {
      this.statisticalOptions = this.mapInfo.get("STATISTICS")
      this.periodOptions = this.mapInfo.get("MAP_FILTER_PERIOD")
      this.providerOptions = this.mapInfo.get("PROVIDER")
      return this.browserFB.build(this.mapInfo, this.form)
    } else {
      this.statisticalOptions = this.mapInfo.get("STATISTICS")
      this.periodOptions = this.mapInfo.get("MAP_FILTER_PERIOD")
      return this.generalFB.build(this.mapInfo, this.form)
    }
  }
}
