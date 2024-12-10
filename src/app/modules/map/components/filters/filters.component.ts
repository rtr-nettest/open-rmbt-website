import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  inject,
  OnDestroy,
  ViewChild,
} from "@angular/core"
import { ETileTypes, MapSourceOptions } from "../../services/map.service"
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
import { NetworkMeasurementType } from "../../interfaces/map-type.interface"
import { IMapInfo } from "../../interfaces/map-info.interface"
import { MatIconModule } from "@angular/material/icon"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { NgIf, NgTemplateOutlet, TitleCasePipe } from "@angular/common"
import { IMapFilter } from "../../interfaces/map-filter.interface"
import { MapStoreService } from "../../store/map-store.service"
import { MAT_DIALOG_DATA } from "@angular/material/dialog"

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
  filters: FormGroup<{
    statistical_method: FormControl<string | null>
    period: FormControl<number | null>
    provider: FormControl<string | null>
    operator: FormControl<string | null>
    technology: FormControl<string | null>
  }>
}

@Component({
  selector: "app-filters",
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
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
  mapInfo!: IMapInfo
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
    private readonly store: MapStoreService
  ) {
    this.mapInfo = data.mapInfo
    for (const t of data.mapInfo.mapfilter.mapTypes) {
      let title = t.title
      for (const o of t.options) {
        this.mapTypesTitles.set(o.map_options, `${title}/${o.title}`)
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
  }

  changeNetworkMeasurementType(v: NetworkMeasurementType) {
    this.form.controls.networkMeasurementType.setValue(v)
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
    return filter.options.find((o: any) => o[field] === value)?.title
  }

  private getFiltersByType(type: NetworkMeasurementType) {
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

  private getAllForm(mapInfo: IMapInfo) {
    const options = mapInfo.mapfilter.mapFilters.wifi
    this.statisticalOptions = options[0]
    this.periodOptions = options[1]
    this.technologyOptions = undefined
    this.providerOptions = undefined
    this.operatorOptions = undefined
    return this.fb.group({
      statistical_method: new FormControl({
        value:
          this.store.filters()?.filters?.statistical_method ??
          this.statisticalOptions.options.find((o) => !!o.default)!
            .statistical_method!,
        disabled: this.form?.controls.tiles.value == ETileTypes.points,
      }),
      period: new FormControl(
        this.store.filters()?.filters?.period ??
          this.periodOptions.options.find((o) => !!o.default)!.period!
      ),
      technology: new FormControl({ value: "", disabled: true }),
      operator: new FormControl({ value: "", disabled: true }),
      provider: new FormControl({ value: "", disabled: true }),
    })
  }

  private getWlanForm(mapInfo: IMapInfo) {
    const options = mapInfo.mapfilter.mapFilters.wifi
    this.statisticalOptions = options[0]
    this.periodOptions = options[2]
    this.technologyOptions = undefined
    this.providerOptions = options[1]
    this.operatorOptions = undefined
    return this.fb.group({
      statistical_method: new FormControl({
        value:
          this.store.filters()?.filters?.statistical_method ??
          this.statisticalOptions.options.find((o) => !!o.default)!
            .statistical_method!,
        disabled: this.form?.controls.tiles.value == ETileTypes.points,
      }),
      period: new FormControl(
        this.store.filters()?.filters?.period ??
          this.periodOptions.options.find((o) => !!o.default)!.period!
      ),
      provider: new FormControl(
        this.store.filters()?.filters?.provider ??
          this.providerOptions.options.find((o) => !!o.default)!.provider!
      ),
      technology: new FormControl({ value: "", disabled: true }),
      operator: new FormControl({ value: "", disabled: true }),
    })
  }

  private getBrowserForm(mapInfo: IMapInfo) {
    const options = mapInfo.mapfilter.mapFilters.browser
    this.statisticalOptions = options[0]
    this.periodOptions = options[2]
    this.technologyOptions = undefined
    this.providerOptions = options[1]
    this.operatorOptions = undefined
    return this.fb.group({
      statistical_method: new FormControl({
        value:
          this.store.filters()?.filters?.statistical_method ??
          this.statisticalOptions.options.find((o) => !!o.default)!
            .statistical_method!,
        disabled: this.form?.controls.tiles.value == ETileTypes.points,
      }),
      period: new FormControl(
        this.store.filters()?.filters?.period ??
          this.periodOptions.options.find((o) => !!o.default)!.period!
      ),
      provider: new FormControl(
        this.store.filters()?.filters?.provider ??
          this.providerOptions.options.find((o) => !!o.default)!.provider!
      ),
      technology: new FormControl({ value: "", disabled: true }),
      operator: new FormControl({ value: "", disabled: true }),
    })
  }

  private getMobileForm(mapInfo: IMapInfo) {
    const options = mapInfo.mapfilter.mapFilters.mobile
    this.statisticalOptions = options[0]
    this.periodOptions = options[2]
    this.technologyOptions = options[3]
    this.providerOptions = undefined
    this.operatorOptions = options[1]
    return this.fb.group({
      statistical_method: new FormControl({
        value:
          this.store.filters()?.filters?.statistical_method ??
          this.statisticalOptions.options.find((o) => !!o.default)!
            .statistical_method!,
        disabled: this.form?.controls.tiles.value == ETileTypes.points,
      }),
      operator: new FormControl(
        this.store.filters()?.filters?.operator ??
          this.operatorOptions.options.find((o) => !!o.default)!.operator!
      ),
      period: new FormControl(
        this.store.filters()?.filters?.period ??
          this.periodOptions.options.find((o) => !!o.default)!.period!
      ),
      technology: new FormControl(
        this.store.filters()?.filters?.technology ??
          this.technologyOptions.options.find((o) => !!o.default)!.technology!
      ),
      provider: new FormControl({ value: "", disabled: true }),
    })
  }
}
