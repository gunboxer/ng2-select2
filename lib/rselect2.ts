import { NgModule } from '@angular/core';

export { S2Option, Select2TemplateFunction } from './rselect2.interface';
import { RSelect2Component } from './rselect2.component';
import {CommonModule} from "@angular/common";

export { RSelect2Component } from './rselect2.component';

@NgModule({
    imports: [CommonModule],
    declarations: [RSelect2Component],
    exports: [RSelect2Component]
})
export class RSelect2Module {}