import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  inject,
  OnDestroy,
  ViewChild,
} from "@angular/core"
import { MapSourceOptions } from "../../services/map.service"
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
import { MapInfoHash } from "../../dto/map-info-hash"

export type FilterSheetData = {
  mapInfo: IMapInfo
  onFiltersChange: (filters: MapSourceOptions) => void
}

type ActiveControlGroup =
  | "networkMeasurementType"
  | "tiles"
  | "statisticalOptions"
  | "periodOptions"
  | "technologyOptions"
  | "operatorOptions"
  | "providerOptions"

type FiltersForm = {
  networkMeasurementType: FormControl<NetworkMeasurementType | null>
  tiles: FormControl<ETileTypes | null>
  filters: FiltersFormFilters
}

type FiltersFormFilters = FormGroup<{
  statistical_method: FormControl<number | null>
  period: FormControl<number | null>
  provider: FormControl<string | number | null>
  operator: FormControl<string | number | null>
  technology: FormControl<string | null>
}>

@Component({
  selector: "app-filters",
  standalone: true,
  imports: [
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
  mapInfo!: MapInfoHash
  mapTypesTitles = new Map<NetworkMeasurementType, string>()
  tilesTypes = Object.values(ETileTypes)
  filters$!: Observable<IMapInfo>
  statisticalOptions?: IMapFilter
  periodOptions?: IMapFilter
  technologyOptions?: IMapFilter
  operatorOptions?: IMapFilter
  providerOptions?: IMapFilter

  get showStatistics() {
    return this.form.controls.tiles.value !== ETileTypes.points
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: FilterSheetData,
    private readonly dialogRef: MatDialogRef<FiltersComponent>,
    private readonly store: MapStoreService
  ) {
    this.mapInfo = new MapInfoHash(data.mapInfo)
    for (const networkType of this.mapInfo.get("MAP_TYPE").options ?? []) {
      for (const metric of networkType.options ?? []) {
        if (metric.params?.map_options)
          this.mapTypesTitles.set(
            metric.params?.map_options,
            `${networkType.title}/${metric.title}`
          )
      }
    }
    const networkMeasurementType =
      this.store.filters()?.networkMeasurementType ?? "mobile/download"
    this.form = this.fb.group({
      networkMeasurementType: new FormControl<NetworkMeasurementType>(
        networkMeasurementType
      ),
      tiles: new FormControl<ETileTypes>(
        this.store.filters()?.tiles ?? this.tilesTypes[0]
      ),
      filters: this.getFiltersByType(networkMeasurementType),
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
    this.data.onFiltersChange(this.store.filters()!)
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
    if (type?.startsWith("mobile")) {
      return this.getMobileForm(this.mapInfo)
    } else if (type?.startsWith("wifi")) {
      return this.getWlanForm(this.mapInfo)
    } else if (type?.startsWith("browser")) {
      return this.getBrowserForm(this.mapInfo)
    } else {
      return this.getAllForm(this.mapInfo)
    }
  }

  private getAllForm(mapInfo: MapInfoHash): FiltersFormFilters {
    this.statisticalOptions = mapInfo.get("STATISTICS")
    this.periodOptions = mapInfo.get("MAP_FILTER_PERIOD")
    this.technologyOptions = undefined
    this.providerOptions = undefined
    this.operatorOptions = undefined
    return this.fb.group({
      statistical_method: new FormControl({
        value:
          this.store.filters()?.filters?.statistical_method ??
          mapInfo.getDefaultValueOf("STATISTICS")?.statistical_method ??
          null,
        disabled: this.form?.controls.tiles.value == ETileTypes.points,
      }),
      period: new FormControl(
        this.store.filters()?.filters?.period ??
          mapInfo.getDefaultValueOf("MAP_FILTER_PERIOD")?.period ??
          null
      ),
      technology: new FormControl<string | null>({
        value: "",
        disabled: true,
      }),
      operator: new FormControl<string | number | null>({
        value: "",
        disabled: true,
      }),
      provider: new FormControl<string | number | null>({
        value: "",
        disabled: true,
      }),
    })
  }

  private getWlanForm(mapInfo: MapInfoHash): FiltersFormFilters {
    this.statisticalOptions = mapInfo.get("STATISTICS")
    this.periodOptions = mapInfo.get("MAP_FILTER_PERIOD")
    this.technologyOptions = mapInfo.get("MAP_FILTER_TECHNOLOGY")
    this.providerOptions = mapInfo.get("PROVIDER")
    this.operatorOptions = undefined
    return this.fb.group({
      statistical_method: new FormControl({
        value:
          this.store.filters()?.filters?.statistical_method ??
          mapInfo.getDefaultValueOf("STATISTICS")?.statistical_method ??
          null,
        disabled: this.form?.controls.tiles.value == ETileTypes.points,
      }),
      period: new FormControl(
        this.store.filters()?.filters?.period ??
          mapInfo.getDefaultValueOf("MAP_FILTER_PERIOD")?.period ??
          null
      ),
      provider: new FormControl<string | number | null>(
        this.store.filters()?.filters?.provider ??
          mapInfo.getDefaultValueOf("PROVIDER")?.provider ??
          null
      ),
      technology: new FormControl({ value: "", disabled: true }),
      operator: new FormControl<string | number | null>({
        value: "",
        disabled: true,
      }),
    })
  }

  private getBrowserForm(mapInfo: MapInfoHash): FiltersFormFilters {
    this.statisticalOptions = mapInfo.get("STATISTICS")
    this.periodOptions = mapInfo.get("MAP_FILTER_PERIOD")
    this.technologyOptions = undefined
    this.providerOptions = mapInfo.get("PROVIDER")
    this.operatorOptions = undefined
    return this.fb.group({
      statistical_method: new FormControl({
        value:
          this.store.filters()?.filters?.statistical_method ??
          mapInfo.getDefaultValueOf("STATISTICS")?.statistical_method ??
          null,
        disabled: this.form?.controls.tiles.value == ETileTypes.points,
      }),
      period: new FormControl(
        this.store.filters()?.filters?.period ??
          mapInfo.getDefaultValueOf("MAP_FILTER_PERIOD")?.period ??
          null
      ),
      provider: new FormControl<string | number | null>(
        this.store.filters()?.filters?.provider ??
          mapInfo.getDefaultValueOf("PROVIDER")?.provider ??
          null
      ),
      technology: new FormControl({ value: "", disabled: true }),
      operator: new FormControl<string | number | null>({
        value: "",
        disabled: true,
      }),
    })
  }

  private getMobileForm(mapInfo: MapInfoHash): FiltersFormFilters {
    this.statisticalOptions = mapInfo.get("STATISTICS")
    this.periodOptions = mapInfo.get("MAP_FILTER_PERIOD")
    this.technologyOptions = mapInfo.get("MAP_FILTER_TECHNOLOGY")
    this.providerOptions = undefined
    this.operatorOptions = mapInfo.get("MAP_FILTER_CARRIER")
    return this.fb.group({
      statistical_method: new FormControl({
        value:
          this.store.filters()?.filters?.statistical_method ??
          mapInfo.getDefaultValueOf("STATISTICS")?.statistical_method ??
          null,
        disabled: this.form?.controls.tiles.value == ETileTypes.points,
      }),
      operator: new FormControl<string | number | null>(
        this.store.filters()?.filters?.operator ??
          mapInfo.getDefaultValueOf("MAP_FILTER_CARRIER")?.operator ??
          null
      ),
      period: new FormControl(
        this.store.filters()?.filters?.period ??
          mapInfo.getDefaultValueOf("MAP_FILTER_PERIOD")?.period ??
          null
      ),
      technology: new FormControl(
        this.store.filters()?.filters?.technology ??
          mapInfo.getDefaultValueOf("MAP_FILTER_TECHNOLOGY")?.technology ??
          null
      ),
      provider: new FormControl<string | number | null>({
        value: "",
        disabled: true,
      }),
    })
  }
}
