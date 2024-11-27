import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import {
  MatPaginator,
  MatPaginatorModule,
  PageEvent,
} from '@angular/material/paginator';

@Component({
  selector: 'app-paginator',
  templateUrl: './paginator.component.html',
  styleUrls: ['./paginator.component.scss'],
  standalone: true,
  imports: [MatPaginatorModule],
})
export class PaginatorComponent {
  @Input() length: number = 0;
  @Input() pageIndex: number = 0;
  @Input() pageSize: number = 0;
  @Input() pageSizeOptions: number[] = [];

  @Output() page: EventEmitter<PageEvent> = new EventEmitter();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  get isIOS() {
    let platform = navigator?.userAgent || navigator?.platform || 'unknown';

    return /iPhone|iPod|iPad/.test(platform);
  }
}
