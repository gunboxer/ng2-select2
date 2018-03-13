import {
    AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnDestroy,
    Output, ViewChild, ViewEncapsulation, Renderer
} from '@angular/core';

import { S2Option } from './rselect2.interface';

@Component({
    selector: 'rselect2',
    styles: ["CSS"],
    template: `
        <select #selector>
            <ng-content select="option, optgroup">
            </ng-content>
        </select>`,
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RSelect2Component implements AfterViewInit, OnDestroy {
    @ViewChild('selector') selector: ElementRef;

    // data for select2 drop down
    _data: Array<S2Option>;
    @Input() set data(data: Array<S2Option>) {
        if (this._data === data || (data === undefined && this._data === undefined) || (data === null && this._data === null)) {
            return;
        }
        this._data = data;
        if(this.element) {
            this.initPlugin();

            if (this.autoSelect) {
                this.value = this.element.val();
            }
        }
    }
    get data(): Array<S2Option> {
        return this._data;
    }

    // value for select2
    _value: string ;
    @Input() set value(value: string ) {
        if (this._value === value || (value === undefined && this._value === undefined) || (value === null && this._value === null)) {
            return;
        }
        this._value = value;
        const newValue: string  = value;
        this.setElementValue(newValue);
        if (!this.entity || this.getEntityId(this.entity) !== newValue) {
            for (const id in this.data) {
                if (this.getEntityId(this.data[id]) === newValue) {
                    this.entity = this.data[id];
                    break;
                }
            }
        }
        this.emitValue(newValue);
    }
    get value(): string  {
        return this._value;
    }

    _entity: S2Option;
    @Input() set entity(entity: S2Option) {
        if (this._entity === entity || (entity === undefined && this._entity === undefined) || (entity === null && this._entity === null)) {
            return;
        }
        this._entity = entity;
        const newValue: S2Option = entity;
        if (!newValue) {
            if ((this.value === undefined || this.value === null || this.value === '')) {
                return;
            } else {
                this.value = null;
            }
        } else {
            const entityId = this.getEntityId(newValue)
            if (this.value !== entityId || (!this.value && !!entityId)) {
                this.value = entityId;
            }
        }
    }
    get entity(): S2Option {
        return this._entity;
    }

    // width of select2 input
    _width: string;
    @Input() set width(width: string) {
        this._width = width;
    }
    get width(): string {
        return this._width
    }

    // enable / disable select2
    _disabled: boolean = false;
    @Input() set disabled(disabled: boolean) {
        this._disabled = disabled;
        if(this.element) {
            this.renderer.setElementProperty(this.selector.nativeElement, 'disabled', disabled);
        }
    }
    get disabled(): boolean {
        return this._disabled;
    }

    // all additional options
    _options: Select2Options;
    @Input() set options(options: Select2Options) {
        this._options = options;
    }
    get options(): Select2Options {
        return this._options
    }

    _idProperty: string | undefined;
    @Input() set idProperty(idProperty: string | undefined) {
        this._idProperty = idProperty;
    }
    get idProperty(): string | undefined {
        return this._idProperty
    }

    _textProperty: string | undefined;
    @Input() set textProperty(textProperty: string | undefined) {
        this._textProperty = textProperty;
    }
    get textProperty(): string | undefined {
        return this._textProperty
    }

    _idGetter: Function | undefined;
    @Input() set idGetter(idGetter: Function | undefined) {
        this._idGetter = idGetter;
    }
    get idGetter(): Function | undefined {
        return this._idGetter
    }

    _textGetter: Function | undefined;
    @Input() set textGetter(textGetter: Function | undefined) {
        this._textGetter = textGetter;
    }
    get textGetter(): Function | undefined {
        return this._textGetter
    }

    _autoSelect = true;
    @Input() set autoSelect(autoSelect: boolean) {
        this._autoSelect = autoSelect;
    }
    get autoSelect(): boolean {
        return this._autoSelect
    }

    // emitter when value is changed
    @Output() valueChanged = new EventEmitter<{value: string , data: any}>();

    @Output() valueChange = new EventEmitter<string >();
    @Output() entityChange = new EventEmitter<S2Option | S2Option[]>();

    private element: JQuery = undefined;
    private check: boolean = false;

    constructor(private renderer: Renderer) { }

    ngAfterViewInit() {
        this.element = jQuery(this.selector.nativeElement);
        this.initPlugin();

        if (typeof this.value !== 'undefined') {
            this.setElementValue(this.value);
        }

        this.element.on('select2:select select2:unselect', (event: {type: string}) => {
            switch (event.type) {
                case 'select2:select':
                    this.value = this.element.val();
                    break;
                case 'select2:unselect':
                    this.value = null;
                    break;
            }
        });
    }

    ngOnDestroy() {
        this.element.off("select2:select");
    }

    private emitValue(newValue: string) {
        if (this.element) {
            this.valueChange.emit(newValue);
            this.entityChange.emit(this.entity);
            this.valueChanged.emit({
                value: newValue,
                data: this.element.select2('data')
            });
        }
    }

    private initPlugin() {
        if(!this.element.select2) {
            if(!this.check) {
                this.check = true;
                console.log("Please add Select2 library (js file) to the project. You can download it from https://github.com/select2/select2/tree/master/dist/js.");
            }

            return;
        }

        // If select2 already initialized remove him and remove all tags inside
        if (this.element.hasClass('select2-hidden-accessible') == true) {
            this.element.select2('destroy');
            this.renderer.setElementProperty(this.selector.nativeElement, 'innerHTML', '');
        }

        if (this.data) {
            this.initIdText();
        }

        if (!this.autoSelect) {
            if ((!this.options || !this.options.placeholder)) {
                this.options = this.options ? this.options : {};
                this.options.placeholder = ' ';
            }
            this.renderer.createElement(this.selector.nativeElement, 'option');
        }

        let options: Select2Options = {
            data: this.data,
            width: (this.width) ? this.width : 'resolve',
        };

        Object.assign(options, this.options);

        if(options.matcher) {
            jQuery.fn.select2.amd.require(['select2/compat/matcher'], (oldMatcher: any) => {
                options.matcher = oldMatcher(options.matcher);
                this.element.select2(options);

                if (typeof this.value !== 'undefined') {
                    this.setElementValue(this.value);
                }
            });
        } else {
            this.element.select2(options);
        }

        if (this.entity && this.value === undefined) {
            this.value = this.getEntityId(this.entity);
        }

        if(this.disabled) {
            this.renderer.setElementProperty(this.selector.nativeElement, 'disabled', this.disabled);
        }
    }

    private initIdText() {
        if (this.idProperty) {
            this.data.forEach(prop => prop.id = prop[this.idProperty]);
        }
        if (this.idGetter) {
            this.data.forEach(prop => prop.id = this.idGetter(prop));
        }
        if (this.textProperty) {
            this.data.forEach(prop => prop.text = prop[this.textProperty]);
        }
        if (this.textGetter) {
            this.data.forEach(prop => prop.text = this.textGetter(prop));
        }
    }

    private getEntityId(entity: S2Option): string {
        if (this.idProperty) {
            return entity[this.idProperty];
        }
        if (this.idGetter) {
            return this.idGetter(entity);
        }
        return entity.id;
    }

    private setElementValue (newValue: string) {
        if(Array.isArray(newValue)) {
            for (let option of this.selector.nativeElement.options) {
                if (newValue.indexOf(option.value) > -1) {
                    this.renderer.setElementProperty(option, 'selected', 'true');
                }
            }
        } else {
            this.renderer.setElementProperty(this.selector.nativeElement, 'value', newValue);
        }

        this.element.trigger('change.select2');
    }
}
