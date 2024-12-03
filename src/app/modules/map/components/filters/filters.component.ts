import { Component, EventEmitter, inject, Output } from "@angular/core"
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
import { tap } from "rxjs"
import {
  IMapType,
  NetworkMeasurementType,
} from "../../interfaces/map-type.interface"
import { IMapInfo } from "../../interfaces/map-info.interface"
import { MatIconModule } from "@angular/material/icon"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { AsyncPipe } from "@angular/common"

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
    TranslatePipe,
  ],
  templateUrl: "./filters.component.html",
  styleUrl: "./filters.component.scss",
})
export class FiltersComponent {
  @Output() filtersChange = new EventEmitter<MapSourceOptions>()
  private readonly fb = inject(FormBuilder)
  private readonly mapService = inject(MapService)
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
    })
  )

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
    const defaultOptions = {
      statistical_method: options[0].options.find((o) => !!o.default)!
        .statistical_method!,
      period: options[1].options.find((o) => !!o.default)!.period!,
    }
    return this.fb.group({
      statistical_method: new FormControl(defaultOptions.statistical_method),
      period: new FormControl(defaultOptions.period),
      technology: new FormControl({ value: "", disabled: true }),
      operator: new FormControl({ value: "", disabled: true }),
      provider: new FormControl({ value: "", disabled: true }),
    })
  }

  private getWlanForm(mapInfo: IMapInfo) {
    const options = mapInfo.mapfilter.mapFilters.wifi
    const defaultOptions = {
      statistical_method: options[0].options.find((o) => !!o.default)!
        .statistical_method!,
      provider: options[1].options.find((o) => !!o.default)!.provider!,
      period: options[2].options.find((o) => !!o.default)!.period!,
    }
    return this.fb.group({
      statistical_method: new FormControl(defaultOptions.statistical_method),
      period: new FormControl(defaultOptions.period),
      provider: new FormControl(defaultOptions.provider),
      technology: new FormControl({ value: "", disabled: true }),
      operator: new FormControl({ value: "", disabled: true }),
    })
  }

  private getBrowserForm(mapInfo: IMapInfo) {
    const options = mapInfo.mapfilter.mapFilters.browser
    const defaultOptions = {
      statistical_method: options[0].options.find((o) => !!o.default)!
        .statistical_method!,
      provider: options[1].options.find((o) => !!o.default)!.provider!,
      period: options[2].options.find((o) => !!o.default)!.period!,
    }
    return this.fb.group({
      statistical_method: new FormControl(defaultOptions.statistical_method),
      period: new FormControl(defaultOptions.period),
      provider: new FormControl(defaultOptions.provider),
      technology: new FormControl({ value: "", disabled: true }),
      operator: new FormControl({ value: "", disabled: true }),
    })
  }

  private getMobileForm(mapInfo: IMapInfo) {
    const options = mapInfo.mapfilter.mapFilters.mobile
    const defaultOptions = {
      statistical_method: options[0].options.find((o) => !!o.default)!
        .statistical_method!,
      operator: options[1].options.find((o) => !!o.default)!.operator!,
      period: options[2].options.find((o) => !!o.default)!.period!,
      technology: options[3].options.find((o) => !!o.default)!.technology!,
    }
    return this.fb.group({
      statistical_method: new FormControl(defaultOptions.statistical_method),
      operator: new FormControl(defaultOptions.operator),
      period: new FormControl(defaultOptions.period),
      technology: new FormControl(defaultOptions.technology),
      provider: new FormControl({ value: "", disabled: true }),
    })
  }
}
