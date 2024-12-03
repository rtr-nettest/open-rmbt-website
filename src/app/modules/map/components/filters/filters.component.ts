import {
  Component,
  EventEmitter,
  inject,
  OnDestroy,
  Output,
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
import {
  IMapType,
  NetworkMeasurementType,
} from "../../interfaces/map-type.interface"
import { IMapInfo } from "../../interfaces/map-info.interface"
import { MatIconModule } from "@angular/material/icon"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { AsyncPipe, NgIf } from "@angular/common"
import { IMapFilterOption } from "../../interfaces/map-filter.interface"

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
    NgIf,
    TranslatePipe,
  ],
  templateUrl: "./filters.component.html",
  styleUrl: "./filters.component.scss",
})
export class FiltersComponent implements OnDestroy {
  ngOnDestroy(): void {
    this.destroyed$.next()
  }

  @Output() filtersChange = new EventEmitter<MapSourceOptions>()
  private readonly fb = inject(FormBuilder)
  private readonly mapService = inject(MapService)
  destroyed$ = new Subject<void>()
  form!: FormGroup<FiltersForm>
  mapInfo!: IMapInfo
  mapTypes!: IMapType[]
  tilesTypes = Object.values(ETileTypes)
  filters$ = this.mapService.getFilters().pipe(
    tap((mapInfo) => {
      this.mapInfo = mapInfo
      this.mapTypes = mapInfo.mapfilter.mapTypes
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
  statisticalOptions: IMapFilterOption[] = []
  periodOptions: IMapFilterOption[] = []
  technologyOptions: IMapFilterOption[] = []
  operatorOptions: IMapFilterOption[] = []
  providerOptions: IMapFilterOption[] = []

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

  applyFilters() {
    this.filtersChange.emit(this.form.value)
  }

  private getAllForm(mapInfo: IMapInfo) {
    const options = mapInfo.mapfilter.mapFilters.wifi
    this.statisticalOptions = options[0].options
    this.periodOptions = options[1].options
    this.technologyOptions = []
    this.providerOptions = []
    this.operatorOptions = []
    return this.fb.group({
      statistical_method: new FormControl({
        value: this.statisticalOptions.find((o) => !!o.default)!
          .statistical_method!,
        disabled: this.form?.controls.tiles.value == ETileTypes.points,
      }),
      period: new FormControl(
        this.periodOptions.find((o) => !!o.default)!.period!
      ),
      technology: new FormControl({ value: "", disabled: true }),
      operator: new FormControl({ value: "", disabled: true }),
      provider: new FormControl({ value: "", disabled: true }),
    })
  }

  private getWlanForm(mapInfo: IMapInfo) {
    const options = mapInfo.mapfilter.mapFilters.wifi
    this.statisticalOptions = options[0].options
    this.periodOptions = options[2].options
    this.technologyOptions = []
    this.providerOptions = options[1].options
    this.operatorOptions = []
    return this.fb.group({
      statistical_method: new FormControl({
        value: this.statisticalOptions.find((o) => !!o.default)!
          .statistical_method!,
        disabled: this.form?.controls.tiles.value == ETileTypes.points,
      }),
      period: new FormControl(
        this.periodOptions.find((o) => !!o.default)!.period!
      ),
      provider: new FormControl(
        this.providerOptions.find((o) => !!o.default)!.provider!
      ),
      technology: new FormControl({ value: "", disabled: true }),
      operator: new FormControl({ value: "", disabled: true }),
    })
  }

  private getBrowserForm(mapInfo: IMapInfo) {
    const options = mapInfo.mapfilter.mapFilters.browser
    this.statisticalOptions = options[0].options
    this.periodOptions = options[2].options
    this.technologyOptions = []
    this.providerOptions = options[1].options
    this.operatorOptions = []
    return this.fb.group({
      statistical_method: new FormControl({
        value: this.statisticalOptions.find((o) => !!o.default)!
          .statistical_method!,
        disabled: this.form?.controls.tiles.value == ETileTypes.points,
      }),
      period: new FormControl(
        this.periodOptions.find((o) => !!o.default)!.period!
      ),
      provider: new FormControl(
        this.providerOptions.find((o) => !!o.default)!.provider!
      ),
      technology: new FormControl({ value: "", disabled: true }),
      operator: new FormControl({ value: "", disabled: true }),
    })
  }

  private getMobileForm(mapInfo: IMapInfo) {
    const options = mapInfo.mapfilter.mapFilters.mobile
    this.statisticalOptions = options[0].options
    this.periodOptions = options[2].options
    this.technologyOptions = options[3].options
    this.providerOptions = []
    this.operatorOptions = options[1].options
    return this.fb.group({
      statistical_method: new FormControl({
        value: this.statisticalOptions.find((o) => !!o.default)!
          .statistical_method!,
        disabled: this.form?.controls.tiles.value == ETileTypes.points,
      }),
      operator: new FormControl(
        this.operatorOptions.find((o) => !!o.default)!.operator!
      ),
      period: new FormControl(
        this.periodOptions.find((o) => !!o.default)!.period!
      ),
      technology: new FormControl(
        this.technologyOptions.find((o) => !!o.default)!.technology!
      ),
      provider: new FormControl({ value: "", disabled: true }),
    })
  }
}
