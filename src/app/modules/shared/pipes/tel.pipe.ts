import { Pipe, PipeTransform } from "@angular/core"

@Pipe({
  name: "tel",
  standalone: true,
})
export class TelPipe implements PipeTransform {
  transform(phone: string): string {
    return `tel:+${phone.split("+")[1].replace(/[^\d]+/gi, "")}`
  }
}
