import { Component, input } from "@angular/core"
import { MatButtonModule } from "@angular/material/button"
import { MatDialogRef } from "@angular/material/dialog"
import { MatIconModule } from "@angular/material/icon"

@Component({
  selector: "app-close-dialog-header",
  imports: [MatIconModule, MatButtonModule],
  templateUrl: "./close-dialog-header.component.html",
  styleUrl: "./close-dialog-header.component.scss",
})
export class CloseDialogHeaderComponent {
  dialogRef = input.required<MatDialogRef<any>>()
}
