import { Component, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'vt-icon',
  imports: [MatIcon],
  template: `<mat-icon
    fontSet="material-symbols-rounded"
    [class.vt-icon-filled]="filled()"
    [style.font-size.px]="size()"
    [style.width.px]="size()"
    [style.height.px]="size()"
    >{{ name() }}</mat-icon
  >`,
  styles: `
    :host {
      display: inline-flex;
      line-height: 0;
      flex: none;
    }
    mat-icon {
      user-select: none;
    }
  `,
})
export class Icon {
  readonly name = input.required<string>();
  readonly filled = input(false);
  readonly size = input(24);
}
