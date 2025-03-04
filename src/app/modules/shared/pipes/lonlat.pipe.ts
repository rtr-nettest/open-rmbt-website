import { Pipe, PipeTransform } from "@angular/core"
import formatcoords from "formatcoords"

export const LOC_FORMAT = "X DDmm"

@Pipe({
  name: "lonlat",
  standalone: true,
})
export class LonlatPipe implements PipeTransform {
  transform(value: [number, number] | null, ...args: unknown[]): string | null {
    if (!value) {
      return null
    }
    return formatcoords(value[0], value[1]).format(LOC_FORMAT)
  }
}
