import {
  ComponentRef,
  Directive,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  Type,
  ViewContainerRef,
} from '@angular/core';
import { IDynamicComponent } from '../interfaces/dynamic-component.interface';

@Directive({
  selector: '[dynamicComponent]',
  standalone: true,
})
export class DynamicComponentDirective<T> implements OnInit, OnChanges {
  @Input() dynamicComponent?: Type<IDynamicComponent<T>>;
  @Input() parameters?: T;

  private component?: ComponentRef<IDynamicComponent<T>>;

  constructor(private container: ViewContainerRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (this.component && changes['parameters']) {
      this.component.setInput('parameters', changes['parameters'].currentValue);
    }
  }

  ngOnInit(): void {
    if (!this.dynamicComponent) {
      return;
    }
    this.container.clear();
    this.component = this.container.createComponent(this.dynamicComponent);
    if (this.parameters) {
      this.component.instance.parameters = this.parameters;
    }
  }
}
