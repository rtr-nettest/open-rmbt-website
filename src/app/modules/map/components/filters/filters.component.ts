import {
  Component,
  EventEmitter,
  inject,
  OnDestroy,
  Output,
  ViewChild,
} from "@angular/core"
import {
  ETileTypes,
  MapService,
  MapSourceOptions,
} from "../../services/map.service"
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from "@angular/forms"
import { MatRadioModule } from "@angular/material/radio"
import { MatButtonModule } from "@angular/material/button"
import { Subject, takeUntil, tap } from "rxjs"
import { MatTabGroup, MatTabsModule } from "@angular/material/tabs"
import {
  IMapType,
  NetworkMeasurementType,
} from "../../interfaces/map-type.interface"
import { IMapInfo } from "../../interfaces/map-info.interface"
import { MatIconModule } from "@angular/material/icon"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import {
  AsyncPipe,
  NgIf,
  NgTemplateOutlet,
  TitleCasePipe,
  UpperCasePipe,
} from "@angular/common"
import {
  IMapFilter,
  IMapFilterOption,
} from "../../interfaces/map-filter.interface"

type ActiveControlGroup =
  | "networkMeasurementType"
  | "tiles"
  | "statisticalOptions"
  | "periodOptions"
  | "technologyOptions"
  | "operatorOptions"
  | "providerOptions"

export type FiltersForm = {
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
    AsyncPipe,
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
})
export class FiltersComponent implements OnDestroy {
  @ViewChild("tabs") tabs: MatTabGroup | undefined
  @Output() filtersChange = new EventEmitter<MapSourceOptions>()
  private readonly fb = inject(FormBuilder)
  private readonly mapService = inject(MapService)
  activeControlGroup?: ActiveControlGroup
  destroyed$ = new Subject<void>()
  form!: FormGroup<FiltersForm>
  mapInfo!: IMapInfo
  mapTypesTitles = new Map<NetworkMeasurementType, string>()
  tilesTypes = Object.values(ETileTypes)
  filters$ = this.mapService.getFilters().pipe(
    tap((mapInfo) => {
      this.mapInfo = mapInfo
      for (const t of mapInfo.mapfilter.mapTypes) {
        let title = t.title
        for (const o of t.options) {
          this.mapTypesTitles.set(o.map_options, `${title}/${o.title}`)
        }
      }
      this.form = this.fb.group({
        networkMeasurementType: new FormControl<NetworkMeasurementType>(
          "mobile/download"
        ),
        tiles: new FormControl<ETileTypes>(this.tilesTypes[0]),
        filters: this.getMobileForm(mapInfo),
      })
      this.form.controls.tiles.valueChanges
        .pipe(
          takeUntil(this.destroyed$),
          tap((value) => {
            if (value === ETileTypes.points) {
              this.form.controls.filters.controls.statistical_method.disable()
            } else {
              this.form.controls.filters.controls.statistical_method.enable()
            }
          })
        )
        .subscribe()
    })
  )
  statisticalOptions?: IMapFilter
  periodOptions?: IMapFilter
  technologyOptions?: IMapFilter
  operatorOptions?: IMapFilter
  providerOptions?: IMapFilter

  ngOnDestroy(): void {
    this.destroyed$.next()
  }

  changeNetworkMeasurementType(v: NetworkMeasurementType) {
    this.form.controls.networkMeasurementType.setValue(v)
    if (v?.startsWith("mobile")) {
      this.form.setControl("filters", this.getMobileForm(this.mapInfo))
    } else if (v?.startsWith("wifi")) {
      this.form.setControl("filters", this.getWlanForm(this.mapInfo))
    } else if (v?.startsWith("browser")) {
      this.form.setControl("filters", this.getBrowserForm(this.mapInfo))
    } else {
      this.form.setControl("filters", this.getAllForm(this.mapInfo))
    }
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
    this.filtersChange.emit(this.form.value)
  }

  getFilterTitleFromValue(
    filter: IMapFilter,
    field: string,
    value: string | number
  ) {
    return filter.options.find((o: any) => o[field] === value)?.title
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
        value: this.statisticalOptions.options.find((o) => !!o.default)!
          .statistical_method!,
        disabled: this.form?.controls.tiles.value == ETileTypes.points,
      }),
      period: new FormControl(
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
        value: this.statisticalOptions.options.find((o) => !!o.default)!
          .statistical_method!,
        disabled: this.form?.controls.tiles.value == ETileTypes.points,
      }),
      period: new FormControl(
        this.periodOptions.options.find((o) => !!o.default)!.period!
      ),
      provider: new FormControl(
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
        value: this.statisticalOptions.options.find((o) => !!o.default)!
          .statistical_method!,
        disabled: this.form?.controls.tiles.value == ETileTypes.points,
      }),
      period: new FormControl(
        this.periodOptions.options.find((o) => !!o.default)!.period!
      ),
      provider: new FormControl(
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
        value: this.statisticalOptions.options.find((o) => !!o.default)!
          .statistical_method!,
        disabled: this.form?.controls.tiles.value == ETileTypes.points,
      }),
      operator: new FormControl(
        this.operatorOptions.options.find((o) => !!o.default)!.operator!
      ),
      period: new FormControl(
        this.periodOptions.options.find((o) => !!o.default)!.period!
      ),
      technology: new FormControl(
        this.technologyOptions.options.find((o) => !!o.default)!.technology!
      ),
      provider: new FormControl({ value: "", disabled: true }),
    })
  }
}
