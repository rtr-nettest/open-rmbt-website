import { Pipe, PipeTransform } from "@angular/core"
import formatcoords from "formatcoords"

@Pipe({
  name: "lonlat",
  standalone: true,
})
export class LonlatPipe implements PipeTransform {
  transform(value: [number, number] | null, ...args: unknown[]): unknown {
    if (!value) {
      return null
    }
    const coords = formatcoords(value[0], value[1])
    return coords.format("X DDmm")
  }
}
