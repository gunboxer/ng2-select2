import { NgModule } from '@angular/core';

export { S2Option, Select2TemplateFunction } from './ng2-select2.interface';
import { Select2Component } from './ng2-select2.component';
import {CommonModule} from "@angular/common";

export { Select2Component } from './ng2-select2.component';

@NgModule({
    imports: [CommonModule],
    declarations: [Select2Component],
    exports: [Select2Component]
})
export class Select2Module {}