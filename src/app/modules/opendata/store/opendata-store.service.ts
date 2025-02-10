import { computed, Injectable, signal } from "@angular/core"
import { IOpendataFilters } from "../interfaces/opendata-filters.interface"
import { searchFromFilters } from "../../shared/util/search"

const DEFAULT_FILTERS: IOpendataFilters = {
  max_results: 400,
  additional_info: ["download_classification", "signal_classification"],
}

@Injectable({
  providedIn: "root",
})
export class OpendataStoreService {
  filters = signal<IOpendataFilters>({ ...DEFAULT_FILTERS })
}
