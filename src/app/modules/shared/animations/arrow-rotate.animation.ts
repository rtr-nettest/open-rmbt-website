import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';

export const arrowRotate = trigger('arrowRotate', [
  state('false', style({ transform: 'rotate(0deg)' })),
  state('true', style({ transform: 'rotate(-180deg)' })),
  transition('false <=> true', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
]);
